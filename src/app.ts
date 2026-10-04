import { Hono } from "hono";
import { cors } from "hono/cors";
import { Bot, webhookCallback } from "grammy";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { handleMessage } from "./chat.js";
import { runReminderSweep } from "./reminders.js";
import { registerBotHandlers } from "./bot-handlers.js";
import { verifyLinkCode } from "./link.js";
import { SUPPORTED_LANGS } from "./lang.js";
import { savePushSubscription, type PushSubscriptionJSON } from "./push.js";
import { registerAccount, loginAccount, attachTelegramRecovery, resetPasswordViaTelegram } from "./account.js";

export const app = new Hono();

app.use("/api/*", cors());

app.get("/", (c) => {
  try {
    const html = readFileSync(join(process.cwd(), "views", "index.html"), "utf-8");
    const withVapid = html.replace("__VAPID_PUBLIC_KEY__", process.env.VAPID_PUBLIC_KEY ?? "");
    return c.html(withVapid);
  } catch (err) {
    console.error("[static] failed to read views/index.html:", err);
    return c.text("DuoMind - UI file missing", 500);
  }
});

app.get("/avatar.png", (c) => {
  try {
    const bytes = readFileSync(join(process.cwd(), "public", "avatar.png"));
    return c.body(bytes, 200, { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" });
  } catch (err) {
    console.error("[static] failed to read public/avatar.png:", err);
    return c.notFound();
  }
});

app.get("/sw.js", (c) => {
  try {
    const js = readFileSync(join(process.cwd(), "public", "sw.js"), "utf-8");
    return c.body(js, 200, { "Content-Type": "application/javascript" });
  } catch (err) {
    console.error("[static] failed to read public/sw.js:", err);
    return c.notFound();
  }
});

let bot: Bot | null = null;
function getBot(): Bot {
  if (bot) return bot;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");
  bot = new Bot(token);
  registerBotHandlers(bot);
  return bot;
}

// Production Telegram entrypoint (webhook mode) - used when deployed (e.g. Vercel).
// For local development, use `npm run dev` (long polling, src/telegram.ts) instead;
// Telegram only allows one delivery mode active at a time per bot token.
app.post("/api/telegram-webhook", async (c) => {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret && c.req.header("x-telegram-bot-api-secret-token") !== secret) {
    return c.json({ error: "unauthorized" }, 401);
  }
  return webhookCallback(getBot(), "hono")(c);
});

app.post("/api/chat", async (c) => {
  const body = await c.req.json<{ userId?: unknown; message?: unknown; lang?: unknown }>().catch(() => null);
  if (typeof body?.userId !== "string" || !body.userId || typeof body.message !== "string" || !body.message.trim()) {
    return c.json({ error: "userId and message are required (both strings)" }, 400);
  }
  if (body.message.length > 20000) {
    return c.json({ error: "Message is too long. Please keep it under a few paragraphs." }, 413);
  }
  try {
    const lang =
      typeof body.lang === "string" && Object.prototype.hasOwnProperty.call(SUPPORTED_LANGS, body.lang)
        ? body.lang
        : undefined;
    const replies = await handleMessage(body.userId, body.message, lang, { soft: true });
    return c.json({ replies });
  } catch (err) {
    console.error(err);
    if ((err as { status?: number })?.status === 429) {
      return c.json({ error: "The memory service is busy right now. Please try again in a minute." }, 429);
    }
    return c.json({ error: "Failed to reach memory or the model." }, 500);
  }
});

app.get("/api/health", (c) => c.json({ ok: true }));

app.post("/api/push-subscribe", async (c) => {
  const body = await c.req.json<{ userId?: string; subscription?: PushSubscriptionJSON }>().catch(() => null);
  if (!body?.userId || !body?.subscription?.endpoint) {
    return c.json({ error: "userId and subscription are required" }, 400);
  }
  try {
    await savePushSubscription(body.userId, body.subscription);
    return c.json({ ok: true });
  } catch (err) {
    console.error("[push] failed to save subscription:", err);
    return c.json({ error: "Failed to save subscription" }, 500);
  }
});

// Links the web app to a Telegram user's exact memory namespace: the web
// client trades a short-lived code (from the bot's /link command) for the
// canonical userId, so both channels point at the same Walrus namespace.
app.post("/api/link", async (c) => {
  const body = await c.req.json<{ code?: string }>().catch(() => null);
  if (!body?.code) return c.json({ error: "code is required" }, 400);
  const chatId = verifyLinkCode(body.code);
  if (!chatId) return c.json({ error: "Code is invalid or expired. Send /link to the bot again." }, 400);
  return c.json({ userId: chatId });
});

// Real accounts: username + password resolve to a stable namespace (not
// derived from the password itself), so a password reset can repoint the
// same username at the same memory instead of orphaning it.
app.post("/api/register", async (c) => {
  const body = await c.req.json<{ username?: string; password?: string }>().catch(() => null);
  if (!body?.username || !body?.password) return c.json({ error: "username and password are required" }, 400);
  try {
    const result = await registerAccount(body.username, body.password);
    if (!result.ok) return c.json({ error: "That username is taken. Try another." }, 409);
    return c.json({ userId: result.userId });
  } catch (err) {
    console.error("[account] register failed:", err);
    if ((err as { status?: number })?.status === 429) {
      return c.json({ error: "The service is busy right now. Please try again in a minute." }, 429);
    }
    return c.json({ error: "Failed to create account" }, 500);
  }
});

app.post("/api/login", async (c) => {
  const body = await c.req.json<{ username?: string; password?: string }>().catch(() => null);
  if (!body?.username || !body?.password) return c.json({ error: "username and password are required" }, 400);
  try {
    const result = await loginAccount(body.username, body.password);
    if (!result.ok) {
      return c.json(
        { error: result.error === "wrong_password" ? "Wrong password." : "not_found" },
        result.error === "wrong_password" ? 401 : 404
      );
    }
    return c.json({ userId: result.userId });
  } catch (err) {
    console.error("[account] login failed:", err);
    if ((err as { status?: number })?.status === 429) {
      return c.json({ error: "The service is busy right now. Please try again in a minute." }, 429);
    }
    return c.json({ error: "Failed to sign in" }, 500);
  }
});

// Attaches a Telegram chat (proven via a /link code) as a recovery method
// for an account the caller must already be able to sign in to.
app.post("/api/account/attach-telegram", async (c) => {
  const body = await c.req
    .json<{ username?: string; password?: string; code?: string }>()
    .catch(() => null);
  if (!body?.username || !body?.password || !body?.code) {
    return c.json({ error: "username, password and code are required" }, 400);
  }
  const login = await loginAccount(body.username, body.password);
  if (!login.ok) return c.json({ error: "Wrong username or password." }, 401);
  const chatId = verifyLinkCode(body.code);
  if (!chatId) return c.json({ error: "Code is invalid or expired. Send /link to the bot again." }, 400);
  try {
    await attachTelegramRecovery(body.username, chatId);
    return c.json({ ok: true });
  } catch (err) {
    console.error("[account] attach-telegram failed:", err);
    return c.json({ error: "Failed to attach Telegram" }, 500);
  }
});

// Resets a password using a Telegram chat previously attached as recovery.
// Keeps the same underlying memory namespace.
app.post("/api/account/reset-password", async (c) => {
  const body = await c.req
    .json<{ username?: string; newPassword?: string; code?: string }>()
    .catch(() => null);
  if (!body?.username || !body?.newPassword || !body?.code) {
    return c.json({ error: "username, newPassword and code are required" }, 400);
  }
  const chatId = verifyLinkCode(body.code);
  if (!chatId) return c.json({ error: "Code is invalid or expired. Send /link to the bot again." }, 400);
  try {
    const result = await resetPasswordViaTelegram(body.username, chatId, body.newPassword);
    if (!result.ok) {
      return c.json(
        {
          error:
            result.error === "no_recovery"
              ? "This Telegram account isn't attached as a recovery method for that username."
              : "No account with that username.",
        },
        400
      );
    }
    return c.json({ userId: result.userId });
  } catch (err) {
    console.error("[account] reset-password failed:", err);
    return c.json({ error: "Failed to reset password" }, 500);
  }
});

// Daily sweep: checks every Telegram user's memory for birthdays/anniversaries
// coming up in the next 3 days and proactively messages them. Triggered by
// Vercel Cron (see vercel.json) or manually with the right secret.
app.get("/api/cron/reminders", async (c) => {
  const secret = process.env.CRON_SECRET;
  const auth = c.req.header("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return c.json({ error: "unauthorized" }, 401);
  }
  try {
    const result = await runReminderSweep();
    return c.json({ ok: true, ...result });
  } catch (err) {
    console.error("[reminders] sweep failed:", err);
    return c.json({ error: "Reminder sweep failed" }, 500);
  }
});
