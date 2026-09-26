import "dotenv/config";
import { Bot } from "grammy";
import { handleMessage } from "./chat.js";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");

const bot = new Bot(token);

bot.command("start", (ctx) =>
  ctx.reply(
    "TradeMind here. Tell me about your trades, strategy, or watchlist — I'll remember it across sessions, permanently, on Walrus."
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

bot.start();
console.log("TradeMind bot running (long polling)...");
