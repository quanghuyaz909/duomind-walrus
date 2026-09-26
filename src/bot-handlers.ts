import { Bot } from "grammy";
import { handleMessage } from "./chat.js";
import { generateLinkCode } from "./link.js";

export function registerBotHandlers(bot: Bot): void {
  bot.command("start", (ctx) =>
    ctx.reply(
      "DuoMind here. Tell me about your partner - their birthday, likes, plans, gift ideas - I'll remember it across sessions, permanently, on Walrus.\n\nWant to see the same memory on the web? Send /link."
    )
  );

  bot.command("link", (ctx) => {
    if (!ctx.from) return;
    const chatId = String(ctx.from.id);
    const code = generateLinkCode(chatId);
    ctx.reply(
      `Paste this code into the DuoMind web app (sign-in screen -> "Link Telegram") within 15 minutes:\n\n${code}\n\nThat links the web app to this exact memory - no data is copied, both point at the same place.`
    );
  });

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
}
