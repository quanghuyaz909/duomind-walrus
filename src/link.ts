import { createHmac } from "node:crypto";

const CODE_TTL_SECONDS = 15 * 60;

function secret(): string {
  const s = process.env.TELEGRAM_WEBHOOK_SECRET || process.env.MEMWAL_PRIVATE_KEY;
  if (!s) throw new Error("No secret available to sign link codes (set TELEGRAM_WEBHOOK_SECRET)");
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex").slice(0, 10);
}

/** Generates a short-lived code that proves ownership of a Telegram chat id. */
export function generateLinkCode(chatId: string): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = `${chatId}.${issuedAt}`;
  const sig = sign(payload);
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

/** Verifies a code and returns the Telegram chat id it was issued for, or null. */
export function verifyLinkCode(code: string): string | null {
  try {
    const decoded = Buffer.from(code, "base64url").toString("utf-8");
    const [chatId, issuedAtStr, sig] = decoded.split(".");
    if (!chatId || !issuedAtStr || !sig) return null;
    const issuedAt = Number(issuedAtStr);
    if (!Number.isFinite(issuedAt)) return null;
    if (Date.now() / 1000 - issuedAt > CODE_TTL_SECONDS) return null;
    const expected = sign(`${chatId}.${issuedAtStr}`);
    if (expected !== sig) return null;
    return chatId;
  } catch {
    return null;
  }
}
