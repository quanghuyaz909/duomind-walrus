import { randomUUID, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { recallMemories, rememberFact } from "./memory.js";

// Shared internal namespace holding every account + recovery record.
// Not tied to any end user - it's our own bookkeeping namespace.
//
// Known limitation: writes here use the fast, non-blocking remember() (not
// rememberAndWait), so a fact can take up to ~30s to become recallable.
// Registering and then immediately logging in works because register()
// returns the namespace it just generated directly, with no recall needed.
// But registering the same username twice within that window (e.g. two
// browser tabs racing) can create two competing ACCOUNT facts before either
// is visible to the other - a real but narrow race, acceptable for this
// project's scale.
const DIRECTORY_USER = "accounts-directory";

function normalize(username: string): string {
  return username.trim().toLowerCase();
}

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

interface AccountRecord {
  username: string;
  namespace: string;
  passwordHash: string;
  salt: string;
  createdAt?: string;
}

function parseAccountFact(text: string): AccountRecord | null {
  if (!text.startsWith("ACCOUNT|")) return null;
  const fields: Record<string, string> = {};
  for (const part of text.split("|").slice(1)) {
    const [k, v] = part.split("=");
    if (k && v !== undefined) fields[k] = v;
  }
  if (!fields.username || !fields.namespace || !fields.passwordHash || !fields.salt) return null;
  return {
    username: fields.username,
    namespace: fields.namespace,
    passwordHash: fields.passwordHash,
    salt: fields.salt,
  };
}

async function findAccount(username: string): Promise<AccountRecord | null> {
  const uname = normalize(username);
  const memories = await recallMemories(DIRECTORY_USER, `account ${uname}`, 20);
  const candidates = memories
    .map((m) => ({ record: parseAccountFact(m.text), createdAt: m.created_at }))
    .filter((c) => c.record && c.record.username === uname) as {
    record: AccountRecord;
    createdAt?: string;
  }[];
  if (candidates.length === 0) return null;
  // Latest wins: a password reset stores a new ACCOUNT fact for the same
  // username (same namespace, new hash) rather than mutating the old one.
  candidates.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  return candidates[0].record;
}

export type RegisterResult =
  | { ok: true; userId: string }
  | { ok: false; error: "taken" };

export async function registerAccount(username: string, password: string): Promise<RegisterResult> {
  const uname = normalize(username);
  const existing = await findAccount(uname);
  if (existing) return { ok: false, error: "taken" };

  const namespace = randomUUID();
  const salt = randomBytes(16).toString("hex");
  const passwordHash = hashPassword(password, salt);
  await rememberFact(
    DIRECTORY_USER,
    `ACCOUNT|username=${uname}|namespace=${namespace}|salt=${salt}|passwordHash=${passwordHash}`
  );
  return { ok: true, userId: namespace };
}

export type LoginResult =
  | { ok: true; userId: string }
  | { ok: false; error: "not_found" }
  | { ok: false; error: "wrong_password" };

export async function loginAccount(username: string, password: string): Promise<LoginResult> {
  const account = await findAccount(username);
  if (!account) return { ok: false, error: "not_found" };
  const candidateHash = hashPassword(password, account.salt);
  if (!safeEqual(candidateHash, account.passwordHash)) return { ok: false, error: "wrong_password" };
  return { ok: true, userId: account.namespace };
}

function parseRecoveryFact(text: string): { username: string; telegramId: string } | null {
  if (!text.startsWith("RECOVERY|")) return null;
  const fields: Record<string, string> = {};
  for (const part of text.split("|").slice(1)) {
    const [k, v] = part.split("=");
    if (k && v !== undefined) fields[k] = v;
  }
  if (!fields.username || !fields.telegramId) return null;
  return { username: fields.username, telegramId: fields.telegramId };
}

/** Attaches a Telegram chat id as a recovery method for an existing, already-authenticated account. */
export async function attachTelegramRecovery(username: string, telegramId: string): Promise<void> {
  const uname = normalize(username);
  await rememberFact(DIRECTORY_USER, `RECOVERY|username=${uname}|telegramId=${telegramId}`);
}

async function hasRecovery(username: string, telegramId: string): Promise<boolean> {
  const uname = normalize(username);
  const memories = await recallMemories(DIRECTORY_USER, `recovery ${uname}`, 20);
  return memories.some((m) => {
    const r = parseRecoveryFact(m.text);
    return r && r.username === uname && r.telegramId === telegramId;
  });
}

export type ResetResult =
  | { ok: true; userId: string }
  | { ok: false; error: "not_found" | "no_recovery" };

/** Resets a password using a verified Telegram chat id as proof of recovery access. Keeps the same namespace/memory. */
export async function resetPasswordViaTelegram(
  username: string,
  telegramId: string,
  newPassword: string
): Promise<ResetResult> {
  const account = await findAccount(username);
  if (!account) return { ok: false, error: "not_found" };
  const allowed = await hasRecovery(username, telegramId);
  if (!allowed) return { ok: false, error: "no_recovery" };

  const uname = normalize(username);
  const salt = randomBytes(16).toString("hex");
  const passwordHash = hashPassword(newPassword, salt);
  await rememberFact(
    DIRECTORY_USER,
    `ACCOUNT|username=${uname}|namespace=${account.namespace}|salt=${salt}|passwordHash=${passwordHash}`
  );
  return { ok: true, userId: account.namespace };
}
