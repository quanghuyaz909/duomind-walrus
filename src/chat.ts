import { recallMemories, recallProfile, rememberFact } from "./memory.js";
import { chatComplete, SYSTEM_PROMPT } from "./llm.js";
import { extractFacts } from "./extract.js";

export async function handleMessage(userId: string, message: string) {
  const [relevant, profile] = await Promise.all([
    recallMemories(userId, message),
    recallProfile(userId),
  ]);

  const memoryBlock = [...profile, ...relevant]
    .filter((m, i, arr) => arr.findIndex((x) => x.text === m.text) === i)
    .map((m) => `- ${m.text}`)
    .join("\n");

  const contextPrompt = memoryBlock
    ? `What you remember about this user:\n${memoryBlock}`
    : "You don't have any memory of this user yet.";

  const reply = await chatComplete([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "system", content: contextPrompt },
    { role: "user", content: message },
  ]);

  extractFacts(message)
    .then((facts) => Promise.all(facts.map((fact) => rememberFact(userId, fact))))
    .catch((err) => console.error("[memory] failed to store facts:", err));

  return reply;
}
