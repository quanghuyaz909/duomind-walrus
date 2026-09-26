import { recallMemories, recallProfile, rememberFact } from "./memory.js";
import { chatCompleteChunks, SYSTEM_PROMPT, todayContext } from "./llm.js";
import { extractFacts } from "./extract.js";
import { languageInstruction } from "./lang.js";

export async function handleMessage(
  userId: string,
  message: string,
  languageCode?: string
): Promise<string[]> {
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

  const chunks = await chatCompleteChunks(messages);

  // Awaited, not fire-and-forget: on Vercel's Node serverless runtime, work
  // kicked off after the response is prepared can be frozen/killed once the
  // function returns, so a detached .then() here could silently never
  // finish writing the facts it extracted. rememberFact() itself is still
  // the fast "accepted" call (not rememberFactAndWait), so this only adds
  // the extraction LLM call's latency, not Walrus's full indexing time.
  try {
    const facts = await extractFacts(message);
    await Promise.all(facts.map((fact) => rememberFact(userId, fact)));
  } catch (err) {
    console.error("[memory] failed to store facts:", err);
  }

  return chunks;
}
