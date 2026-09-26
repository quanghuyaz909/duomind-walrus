import { chatComplete } from "./llm.js";

const EXTRACT_PROMPT = `Extract durable, worth-remembering facts about the user's partner or
relationship from this message. Only include: important dates (birthday, anniversary,
first date), likes/dislikes, promises made, plans, gift ideas, inside jokes, or things
that matter to the relationship. Skip small talk and anything not durable.
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
