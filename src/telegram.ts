import "dotenv/config";
import { Bot } from "grammy";
import { registerBotHandlers } from "./bot-handlers.js";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");

const bot = new Bot(token);
registerBotHandlers(bot);

bot.start();
console.log("DuoMind bot running (long polling)...");
