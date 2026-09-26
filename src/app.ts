import { Hono } from "hono";
import { cors } from "hono/cors";
import { Bot, webhookCallback } from "grammy";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { handleMessage } from "./chat.js";
import { runReminderSweep } from "./reminders.js";
import { registerBotHandlers } from "./bot-handlers.js";
import { verifyLinkCode } from "./link.js";

export const app = new Hono();

app.use("/api/*", cors());

app.get("/", (c) => {
  try {
    const html = readFileSync(join(process.cwd(), "public", "index.html"), "utf-8");
    return c.html(html);
  } catch (err) {
    console.error("[static] failed to read public/index.html:", err);
    return c.text("DuoMind - UI file missing", 500);
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
  const body = await c.req.json<{ userId?: string; message?: string }>().catch(() => null);
  if (!body?.userId || !body?.message) {
    return c.json({ error: "userId and message are required" }, 400);
  }
  try {
    const replies = await handleMessage(body.userId, body.message);
    return c.json({ replies });
  } catch (err) {
    console.error(err);
    return c.json({ error: "Failed to reach memory or the model." }, 500);
  }
});

app.get("/api/health", (c) => c.json({ ok: true }));

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
