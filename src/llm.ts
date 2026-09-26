import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const model = process.env.GROQ_MODEL ?? "qwen/qwen3.8-27b";

export const SYSTEM_PROMPT = `You are DuoMind, a relationship memory companion for couples.
You help the user keep track of their partner and their relationship: important dates
(birthdays, anniversaries), likes/dislikes, promises made, plans, gift ideas, inside
jokes, and things that came up in past conversations. Ground every answer in what you
actually remember about THIS user's relationship - never generic advice. If you don't
have relevant memory, say so plainly instead of inventing history. Be warm and concise,
like a thoughtful friend who happens to have a perfect memory. Keep replies short -
2 to 5 sentences, or a short list only when the user explicitly asks for options.`;

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

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

async function chatCompleteRaw(messages: ChatMessage[], maxTokens: number) {
  const res = await groq.chat.completions.create({
    model,
    messages,
    temperature: 0.4,
    max_tokens: maxTokens,
  });
  const choice = res.choices[0];
  return {
    text: choice?.message?.content?.trim() ?? "",
    truncated: choice?.finish_reason === "length",
  };
}

export async function chatComplete(messages: ChatMessage[], maxTokens = 500) {
  return (await chatCompleteRaw(messages, maxTokens)).text;
}

/**
 * Like chatComplete, but if the reply got cut off by maxTokens, makes one
 * follow-up call asking the model to continue, and returns the pieces
 * separately so the caller can send them as consecutive messages instead of
 * silently truncating. Keeps each individual request's output small (staying
 * under Groq's per-minute output-token cap) while still allowing longer
 * total replies when the user actually needs one.
 */
export async function chatCompleteChunks(messages: ChatMessage[], maxTokens = 500): Promise<string[]> {
  const first = await chatCompleteRaw(messages, maxTokens);
  if (!first.truncated || !first.text) return [first.text];

  const second = await chatCompleteRaw(
    [
      ...messages,
      { role: "assistant", content: first.text },
      { role: "user", content: "Continue exactly where you left off. Do not repeat anything." },
    ],
    maxTokens
  );
  return second.text ? [first.text, second.text] : [first.text];
}
