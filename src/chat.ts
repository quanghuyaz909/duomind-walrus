import { recallMemories, recallProfile, rememberFact } from "./memory.js";
import { chatCompleteChunks, SYSTEM_PROMPT, todayContext } from "./llm.js";
import { extractFacts } from "./extract.js";
import { languageInstruction } from "./lang.js";

export async function handleMessage(
  userId: string,
  message: string,
  languageCode?: string
): Promise<string[]> {
  // The relayer rejects embedding inputs over 16384 bytes with a 400, so cap what
  // we send for recall/extraction (4000 chars is at most ~12 KB even in Vietnamese).
  message = message.slice(0, MAX_MESSAGE_CHARS);

  const [relevant, profile] = await Promise.all([
    recallMemories(userId, message),
    cachedProfile(userId),
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
  let saveFailed = false;
  try {
    const facts = await extractFacts(message);
    await Promise.all(facts.map((fact) => rememberFact(userId, fact)));
  } catch (err) {
    saveFailed = true;
    console.error("[memory] failed to store facts:", err);
  }

  // The reply was generated before we tried to save, so it may already say "noted".
  // If the save then failed (usually the relayer's 60 requests/min limit), say so
  // instead of leaving the user believing something was remembered that wasn't.
  if (saveFailed && chunks.length > 0) {
    const last = chunks.length - 1;
    chunks[last] += "\n\n" + (SAVE_FAILED_NOTE[languageCode ?? ""] ?? SAVE_FAILED_NOTE.en);
  }

  return chunks;
}

export const MAX_MESSAGE_CHARS = 4000;

// The standing "profile" recall is the same query every message, and each recall
// costs rate-limit budget on the relayer (60 weighted req/min per key, ~8 per chat
// message). Reuse it for a minute per user. Facts take 15-30s to become recallable
// anyway, so a 60s-old profile is barely staler than a fresh one. Process-local and
// best-effort: a cold start just refetches.
const PROFILE_TTL_MS = 60_000;
const profileCache = new Map<string, { at: number; mems: Awaited<ReturnType<typeof recallProfile>> }>();

async function cachedProfile(userId: string) {
  const hit = profileCache.get(userId);
  if (hit && Date.now() - hit.at < PROFILE_TTL_MS) return hit.mems;
  const mems = await recallProfile(userId);
  profileCache.set(userId, { at: Date.now(), mems });
  return mems;
}

const SAVE_FAILED_NOTE: Record<string, string> = {
  en: "(Heads up: I couldn't save that to memory just now because the memory service is busy. Please send it again in a minute.)",
  vi: "(Lưu ý: mình chưa lưu được thông tin này vào bộ nhớ vì dịch vụ đang bận. Bạn gửi lại giúp mình sau khoảng 1 phút nhé.)",
};
