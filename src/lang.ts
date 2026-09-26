import { recallMemories, rememberFact } from "./memory.js";

// Process-local cache bridging Walrus's write-lag: a preference just set via
// setPreferredLanguage is readable from here immediately, before the
// underlying blob has finished indexing and become recallable. Best-effort
// only (cleared on cold start) - the durable source of truth is Walrus.
const languageCache = new Map<string, string>();

export const SUPPORTED_LANGS: Record<string, string> = {
  en: "English",
  vi: "Tiếng Việt",
  zh: "中文",
  es: "Español",
  fr: "Français",
  ja: "日本語",
  ko: "한국어",
};

const GREETINGS: Record<string, string> = {
  en: "Great, I'll reply in English from now on. Tell me about your partner - their birthday, likes, plans, gift ideas - I'll remember it across sessions, permanently, on Walrus.",
  vi: "Được, mình sẽ trả lời bằng Tiếng Việt từ giờ. Kể cho mình nghe về người yêu bạn - sinh nhật, sở thích, kế hoạch, ý tưởng quà tặng - mình sẽ nhớ mãi mãi, xuyên suốt mọi lần trò chuyện, trên Walrus.",
  zh: "好的，从现在起我会用中文回复。告诉我关于你伴侣的事——生日、喜好、计划、礼物想法——我会永久记住，保存在 Walrus 上。",
  es: "Genial, a partir de ahora responderé en español. Cuéntame sobre tu pareja - su cumpleaños, gustos, planes, ideas de regalos - lo recordaré para siempre, en todas las conversaciones, en Walrus.",
  fr: "Parfait, je répondrai en français désormais. Parlez-moi de votre partenaire - anniversaire, goûts, projets, idées de cadeaux - je m'en souviendrai pour toujours, sur Walrus.",
  ja: "了解です、これから日本語で返信します。パートナーについて教えてください - 誕生日、好み、予定、プレゼントのアイデア - Walrus上にずっと記憶します。",
  ko: "좋아요, 이제부터 한국어로 답할게요. 상대방에 대해 이야기해 주세요 - 생일, 취향, 계획, 선물 아이디어 - Walrus에 영구적으로 기억할게요.",
};

export function greetingFor(code: string): string {
  return GREETINGS[code] ?? GREETINGS.en;
}

export function languageInstruction(code: string): string {
  const name = SUPPORTED_LANGS[code] ?? "English";
  return `Always reply in ${name} (language code: ${code}), regardless of what language the user writes in, unless they explicitly ask you to switch languages.`;
}

/** Stores the user's language choice as a durable memory fact. Sets the
 * in-memory cache synchronously (so the very next message in this same
 * process already gets the right language even before the write below is
 * confirmed) and awaits only the fast "job accepted" remember() call - not
 * the full indexing wait (that can take 20-30s). It must still be awaited,
 * not fired-and-forgotten: on Vercel's Node serverless runtime, work kicked
 * off after the response is prepared can be frozen/killed once the calling
 * handler returns, so a detached call here could silently never even reach
 * the "accepted" stage. */
export async function setPreferredLanguage(userId: string, code: string): Promise<void> {
  languageCache.set(userId, code);
  const name = SUPPORTED_LANGS[code] ?? code;
  try {
    await rememberFact(userId, `User's preferred bot language is ${name} (code: ${code}).`);
  } catch (err) {
    console.error("[lang] write failed:", err);
  }
}

/** Recalls the user's stored language preference, defaulting to English. */
export async function getPreferredLanguage(userId: string): Promise<string> {
  const cached = languageCache.get(userId);
  if (cached) return cached;
  try {
    const memories = await recallMemories(userId, "preferred bot language", 3);
    for (const m of memories) {
      const match = m.text.match(/code:\s*([a-z]{2})/i);
      if (match && SUPPORTED_LANGS[match[1].toLowerCase()]) {
        const code = match[1].toLowerCase();
        languageCache.set(userId, code);
        return code;
      }
    }
  } catch (err) {
    console.error("[lang] failed to recall language preference:", err);
  }
  return "en";
}
