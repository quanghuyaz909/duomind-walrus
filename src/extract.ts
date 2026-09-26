import { chatComplete } from "./llm.js";

const EXTRACT_PROMPT = `Extract durable, worth-remembering facts from this trading journal message.
Only include: strategy/thesis, risk tolerance, entries/exits with symbol+price, watchlist
changes, lessons learned, or portfolio changes. Skip small talk and anything not durable.
Return one fact per line, plain text, no numbering. Return nothing if there's nothing worth keeping.

Message: """${"{{message}}"}"""`;

export async function extractFacts(message: string): Promise<string[]> {
  const prompt = EXTRACT_PROMPT.replace("{{message}}", message);
  const raw = await chatComplete([{ role: "user", content: prompt }]);
  return raw
    .split("\n")
    .map((line) => line.replace(/^[-*\d.]+\s*/, "").trim())
    .filter(Boolean);
}
