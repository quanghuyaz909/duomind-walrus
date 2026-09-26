import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const model = process.env.GROQ_MODEL ?? "qwen/qwen3.8-27b";

export const SYSTEM_PROMPT = `You are DuoMind, a relationship memory companion for couples.
You help the user keep track of their partner and their relationship: important dates
(birthdays, anniversaries), likes/dislikes, promises made, plans, gift ideas, inside
jokes, and things that came up in past conversations. Ground every answer in what you
actually remember about THIS user's relationship - never generic advice. If you don't
have relevant memory, say so plainly instead of inventing history. Be warm and concise,
like a thoughtful friend who happens to have a perfect memory.`;

/** Human-readable "today" anchor, used so the model can resolve relative
 * dates ("next Monday", "in two weeks") into absolute ones. Anchored to
 * Asia/Ho_Chi_Minh since that's this app's primary audience's timezone. */
export function todayContext(): string {
  const now = new Date();
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(now);
  return `Today is ${formatted} (Asia/Ho_Chi_Minh time). Resolve any relative date the user mentions (e.g. "next Monday", "in two weeks") into an absolute date based on this.`;
}

export async function chatComplete(messages: { role: "system" | "user" | "assistant"; content: string }[]) {
  const res = await groq.chat.completions.create({
    model,
    messages,
    temperature: 0.4,
  });
  return res.choices[0]?.message?.content?.trim() ?? "";
}
