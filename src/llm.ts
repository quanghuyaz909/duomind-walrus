import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const model = process.env.GROQ_MODEL ?? "qwen/qwen3.8-27b";

export const SYSTEM_PROMPT = `You are TradeMind, a crypto trading journal assistant.
You help the user reason about trades by recalling their past strategy, risk tolerance,
open positions, and lessons they've learned — never generic advice, always grounded in
what you actually remember about THIS user. If you don't have relevant memory, say so
plainly instead of inventing history. You are not a financial advisor; frame guidance as
journaling/reflection support, not investment recommendations.`;

export async function chatComplete(messages: { role: "system" | "user" | "assistant"; content: string }[]) {
  const res = await groq.chat.completions.create({
    model,
    messages,
    temperature: 0.4,
  });
  return res.choices[0]?.message?.content?.trim() ?? "";
}
