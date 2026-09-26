import { Bot } from "grammy";
import { chatComplete } from "./llm.js";
import { recallMemories } from "./memory.js";
import { getPushSubscription, sendPush } from "./push.js";

const REMINDER_PROMPT = `Today's date is {{today}}. Here are memories about a user's relationship:
{{memories}}

Does any memory mention a birthday, anniversary, or other yearly-recurring date that falls
within the next 3 days (including today), matching month and day regardless of year?
If yes, reply with ONE short, warm reminder message for the user (one or two sentences,
mention what's coming up and when). If no, reply with exactly: NONE`;

interface MemwalNamespace {
  name: string;
}

async function listNamespaces(): Promise<string[]> {
  const key = process.env.MEMWAL_PRIVATE_KEY;
  const accountId = process.env.MEMWAL_ACCOUNT_ID;
  if (!key || !accountId) return [];
  const { MemWal } = await import("@mysten-incubation/memwal");
  const memwal = MemWal.create({
    key,
    accountId,
    serverUrl: process.env.MEMWAL_SERVER_URL ?? "https://relayer.memory.walrus.xyz",
  });

  const names: string[] = [];
  let cursor: string | undefined;
  let more = true;
  while (more) {
    const page = await memwal.listNamespaces({ cursor });
    names.push(...page.namespaces.map((n: MemwalNamespace) => n.name));
    cursor = page.next_cursor ?? undefined;
    more = page.has_more;
  }
  return names;
}

function userIdFromNamespace(namespace: string): string | null {
  const match = namespace.match(/^duomind-(.+)$/);
  return match ? match[1] : null;
}

export async function runReminderSweep(): Promise<{ checked: number; sent: number }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const bot = token ? new Bot(token) : null;

  const namespaces = await listNamespaces();
  const today = new Date().toISOString().slice(0, 10);

  let checked = 0;
  let sent = 0;

  for (const namespace of namespaces) {
    const userId = userIdFromNamespace(namespace);
    if (!userId) continue;
    checked++;

    const memories = await recallMemories(userId, "birthday anniversary important date", 10);
    if (memories.length === 0) continue;

    const prompt = REMINDER_PROMPT.replace("{{today}}", today).replace(
      "{{memories}}",
      memories.map((m) => `- ${m.text}`).join("\n")
    );
    const reply = await chatComplete([{ role: "user", content: prompt }], 200);
    if (reply.trim().toUpperCase().startsWith("NONE")) continue;

    let delivered = false;

    // Telegram: userId is the numeric chat id for those namespaces.
    if (bot && /^\d+$/.test(userId)) {
      try {
        await bot.api.sendMessage(userId, reply.trim());
        delivered = true;
      } catch (err) {
        console.error("[reminders] telegram send failed:", err);
      }
    }

    // Web push: any user (Telegram-linked or password-derived) can also
    // have subscribed a browser separately.
    const sub = await getPushSubscription(userId);
    if (sub) {
      const ok = await sendPush(sub, "DuoMind reminder", reply.trim());
      delivered = delivered || ok;
    }

    if (delivered) sent++;
  }

  return { checked, sent };
}
