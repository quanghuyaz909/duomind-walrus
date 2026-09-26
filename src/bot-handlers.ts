import { Bot, InlineKeyboard } from "grammy";
import { handleMessage } from "./chat.js";
import { generateLinkCode } from "./link.js";
import { SUPPORTED_LANGS, getPreferredLanguage, setPreferredLanguage, greetingFor } from "./lang.js";

const WEB_APP_URL = process.env.WEB_APP_URL || "https://walrus-memory-chatbot.vercel.app";

function languageKeyboard(): InlineKeyboard {
  const kb = new InlineKeyboard();
  const codes = Object.keys(SUPPORTED_LANGS);
  codes.forEach((code, i) => {
    kb.text(SUPPORTED_LANGS[code], `lang:${code}`);
    if (i % 2 === 1) kb.row();
  });
  return kb;
}

export function registerBotHandlers(bot: Bot): void {
  bot.command("start", (ctx) =>
    ctx.reply("🌐 Choose your language / Chọn ngôn ngữ / 选择语言 / 言語を選択:", {
      reply_markup: languageKeyboard(),
    })
  );

  bot.on("callback_query:data", async (ctx) => {
    const data = ctx.callbackQuery.data;
    if (!data.startsWith("lang:")) return;
    const code = data.slice("lang:".length);
    if (!SUPPORTED_LANGS[code]) return;
    const userId = String(ctx.from.id);
    await ctx.answerCallbackQuery();
    try {
      await setPreferredLanguage(userId, code);
    } catch (err) {
      console.error("[lang] failed to save preference:", err);
    }
    await ctx.reply(
      `${greetingFor(code)}\n\nWeb app: ${WEB_APP_URL}\n/link - ${linkHint(code)}`
    );
  });

  bot.command("link", (ctx) => {
    if (!ctx.from) return;
    const chatId = String(ctx.from.id);
    const code = generateLinkCode(chatId);
    ctx.reply(
      `Paste this code into the DuoMind web app (${WEB_APP_URL}, sign-in screen -> "Link Telegram") within 15 minutes:\n\n${code}\n\nThat links the web app to this exact memory - no data is copied, both point at the same place.`
    );
  });

  bot.on("message:text", async (ctx) => {
    const userId = String(ctx.from.id);
    await ctx.replyWithChatAction("typing");
    try {
      const languageCode = await getPreferredLanguage(userId);
      const reply = await handleMessage(userId, ctx.message.text, languageCode);
      await ctx.reply(reply || "(no response)");
    } catch (err) {
      console.error(err);
      await ctx.reply("Something went wrong reaching memory or the model. Try again in a bit.");
    }
  });

  bot.catch((err) => console.error("[bot error]", err));
}

function linkHint(code: string): string {
  const hints: Record<string, string> = {
    en: "syncs this same memory with the web app",
    vi: "đồng bộ đúng bộ nhớ này với ứng dụng web",
    zh: "将同一段记忆与网页应用同步",
    es: "sincroniza esta misma memoria con la app web",
    fr: "synchronise cette même mémoire avec l'appli web",
    ja: "このメモリをウェブアプリと同期します",
    ko: "이 기억을 웹 앱과 동기화합니다",
  };
  return hints[code] ?? hints.en;
}
