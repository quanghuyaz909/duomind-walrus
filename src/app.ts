import { Hono } from "hono";
import { cors } from "hono/cors";
import { Bot, webhookCallback } from "grammy";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { handleMessage } from "./chat.js";

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
  bot.command("start", (ctx) =>
    ctx.reply(
      "DuoMind here. Tell me about your partner - their birthday, likes, plans, gift ideas - I'll remember it across sessions, permanently, on Walrus."
    )
  );
  bot.on("message:text", async (ctx) => {
    const userId = String(ctx.from.id);
    await ctx.replyWithChatAction("typing");
    try {
      const reply = await handleMessage(userId, ctx.message.text);
      await ctx.reply(reply || "(no response)");
    } catch (err) {
      console.error(err);
      await ctx.reply("Something went wrong reaching memory or the model. Try again in a bit.");
    }
  });
  bot.catch((err) => console.error("[bot error]", err));
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
    const reply = await handleMessage(body.userId, body.message);
    return c.json({ reply });
  } catch (err) {
    console.error(err);
    return c.json({ error: "Failed to reach memory or the model." }, 500);
  }
});

app.get("/api/health", (c) => c.json({ ok: true }));
