import webpush from "web-push";
import { recallMemories, rememberFact } from "./memory.js";

let configured = false;
function ensureConfigured() {
  if (configured) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";
  if (!publicKey || !privateKey) throw new Error("VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY are not set");
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export interface PushSubscriptionJSON {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/** Stores a browser's push subscription as a durable memory fact. */
export async function savePushSubscription(userId: string, sub: PushSubscriptionJSON): Promise<void> {
  const encoded = Buffer.from(JSON.stringify(sub)).toString("base64");
  await rememberFact(userId, `Web push subscription (base64): ${encoded}`);
}

/** Recalls a user's push subscription, if they have one. */
export async function getPushSubscription(userId: string): Promise<PushSubscriptionJSON | null> {
  try {
    const memories = await recallMemories(userId, "web push subscription", 3);
    for (const m of memories) {
      const match = m.text.match(/Web push subscription \(base64\):\s*(\S+)/);
      if (match) {
        try {
          return JSON.parse(Buffer.from(match[1], "base64").toString("utf-8"));
        } catch {
          continue;
        }
      }
    }
  } catch (err) {
    console.error("[push] failed to recall subscription:", err);
  }
  return null;
}

/** Sends a browser push notification. Returns false (and does not throw) on failure. */
export async function sendPush(sub: PushSubscriptionJSON, title: string, body: string): Promise<boolean> {
  try {
    ensureConfigured();
    await webpush.sendNotification(sub as any, JSON.stringify({ title, body }));
    return true;
  } catch (err) {
    console.error("[push] send failed:", err);
    return false;
  }
}
