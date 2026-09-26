export interface QuickAction {
  key: string;
  icon: string;
}

export const QUICK_ACTION_KEYS = ["date", "likes", "gift", "dateidea", "promise", "recall"] as const;

const ICONS: Record<string, string> = {
  date: "🎂",
  likes: "💛",
  gift: "🎁",
  dateidea: "💌",
  promise: "📝",
  recall: "🧠",
};

const LABELS: Record<string, Record<string, string>> = {
  en: { date: "Log an important date", likes: "Likes & dislikes", gift: "Gift idea", dateidea: "Date idea", promise: "Log a promise/plan", recall: "What do you remember?" },
  vi: { date: "Lưu ngày quan trọng", likes: "Sở thích & điều ghét", gift: "Ý tưởng quà", dateidea: "Ý tưởng hẹn hò", promise: "Lưu lời hứa/kế hoạch", recall: "Nhớ được gì rồi?" },
  zh: { date: "记录重要日期", likes: "喜好与厌恶", gift: "礼物创意", dateidea: "约会点子", promise: "记录承诺/计划", recall: "你记得什么？" },
  es: { date: "Fecha importante", likes: "Gustos y disgustos", gift: "Idea de regalo", dateidea: "Idea de cita", promise: "Promesa/plan", recall: "¿Qué recuerdas?" },
  fr: { date: "Date importante", likes: "Goûts et aversions", gift: "Idée de cadeau", dateidea: "Idée de sortie", promise: "Promesse/projet", recall: "Que te souviens-tu ?" },
  ja: { date: "大事な日を記録", likes: "好き・嫌い", gift: "プレゼントのアイデア", dateidea: "デートのアイデア", promise: "約束・予定を記録", recall: "何を覚えていますか？" },
  ko: { date: "중요한 날짜 기록", likes: "좋아하는 것 & 싫어하는 것", gift: "선물 아이디어", dateidea: "데이트 아이디어", promise: "약속/계획 기록", recall: "뭘 기억하고 있나요?" },
};

const PROMPTS: Record<string, Record<string, string>> = {
  en: { date: "I want to log an important date: ", likes: "Here's something my partner loves: ", gift: "Give me a gift idea for my partner.", dateidea: "Suggest a date idea for us.", promise: "I promised my partner: ", recall: "What do you remember about my relationship so far?" },
  vi: { date: "Mình muốn lưu 1 ngày quan trọng: ", likes: "Người yêu mình rất thích: ", gift: "Gợi ý ý tưởng quà cho người yêu mình đi.", dateidea: "Gợi ý 1 ý tưởng hẹn hò cho tụi mình đi.", promise: "Mình đã hứa với người yêu: ", recall: "Bạn nhớ được gì về mối quan hệ của mình rồi?" },
  zh: { date: "我想记录一个重要日期：", likes: "我的伴侣很喜欢：", gift: "给我一个送伴侣的礼物创意。", dateidea: "给我们一个约会点子。", promise: "我向伴侣承诺过：", recall: "你目前记得我们关系里的哪些事？" },
  es: { date: "Quiero registrar una fecha importante: ", likes: "A mi pareja le encanta: ", gift: "Dame una idea de regalo para mi pareja.", dateidea: "Sugiéreme una idea de cita para nosotros.", promise: "Le prometí a mi pareja: ", recall: "¿Qué recuerdas de mi relación hasta ahora?" },
  fr: { date: "Je veux enregistrer une date importante : ", likes: "Mon/ma partenaire adore : ", gift: "Donne-moi une idée de cadeau pour mon/ma partenaire.", dateidea: "Suggère-moi une idée de sortie pour nous.", promise: "J'ai promis à mon/ma partenaire : ", recall: "Que te souviens-tu de notre relation jusqu'à présent ?" },
  ja: { date: "大事な日を記録したいです：", likes: "パートナーが好きなもの：", gift: "パートナーへのプレゼントのアイデアをください。", dateidea: "私たちのデートのアイデアを提案してください。", promise: "パートナーに約束したこと：", recall: "私たちの関係について今まで何を覚えていますか？" },
  ko: { date: "중요한 날짜를 기록하고 싶어요: ", likes: "제 상대방이 정말 좋아하는 것: ", gift: "제 상대방을 위한 선물 아이디어를 주세요.", dateidea: "우리를 위한 데이트 아이디어를 제안해 주세요.", promise: "제 상대방에게 약속한 것: ", recall: "지금까지 우리 관계에 대해 뭘 기억하고 있나요?" },
};

const HEADER: Record<string, string> = {
  en: "What would you like to do?",
  vi: "Bạn muốn làm gì?",
  zh: "你想做什么？",
  es: "¿Qué te gustaría hacer?",
  fr: "Que voulez-vous faire ?",
  ja: "何をしますか？",
  ko: "무엇을 하고 싶으세요?",
};

export function quickActionHeader(lang: string): string {
  return HEADER[lang] ?? HEADER.en;
}

export function quickActionLabel(key: string, lang: string): string {
  const icon = ICONS[key] ?? "";
  const label = (LABELS[lang] ?? LABELS.en)[key] ?? key;
  return `${icon} ${label}`;
}

export function quickActionPrompt(key: string, lang: string): string {
  return (PROMPTS[lang] ?? PROMPTS.en)[key] ?? "";
}
