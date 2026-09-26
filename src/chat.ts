import { recallMemories, recallProfile, rememberFact } from "./memory.js";
import { chatComplete, SYSTEM_PROMPT, todayContext } from "./llm.js";
import { extractFacts } from "./extract.js";
import { languageInstruction } from "./lang.js";

export async function handleMessage(userId: string, message: string, languageCode?: string) {
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

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "system", content: todayContext() },
    { role: "system", content: contextPrompt },
  ];
  if (languageCode) messages.push({ role: "system", content: languageInstruction(languageCode) });
  messages.push({ role: "user", content: message });

  const reply = await chatComplete(messages);

  extractFacts(message)
    .then((facts) => Promise.all(facts.map((fact) => rememberFact(userId, fact))))
    .catch((err) => console.error("[memory] failed to store facts:", err));

  return reply;
}
