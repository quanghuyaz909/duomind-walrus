import { MemWal } from "@mysten-incubation/memwal";

// The hosted relayer rate-limits per delegate key (60 weighted requests/min), so
// one key caps the whole app at roughly a dozen messages a minute. Extra delegate
// keys registered on the SAME Walrus Memory account (dashboard -> "Add key") can
// be listed in MEMWAL_EXTRA_KEYS (comma separated). Each user is pinned to one key
// by hash, and a request that hits 429 (or a key the relayer rejects) falls through
// to the next key. Every key reads and writes the same namespaces.
const clients = new Map<string, MemWal>();

function allKeys(): string[] {
  const keys = [process.env.MEMWAL_PRIVATE_KEY, ...(process.env.MEMWAL_EXTRA_KEYS ?? "").split(",")]
    .map((k) => k?.trim())
    .filter((k): k is string => !!k);
  return [...new Set(keys)];
}

function clientFor(key: string): MemWal {
  let c = clients.get(key);
  if (c) return c;
  const accountId = process.env.MEMWAL_ACCOUNT_ID;
  if (!accountId) {
    throw new Error("MEMWAL_ACCOUNT_ID must be set in .env (see memory.walrus.xyz)");
  }
  c = MemWal.create({
    key,
    accountId,
    serverUrl: process.env.MEMWAL_SERVER_URL ?? "https://relayer.memory.walrus.xyz",
    namespace: "duomind",
  });
  clients.set(key, c);
  return c;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

async function withKey<T>(userId: string, fn: (m: MemWal) => Promise<T>): Promise<T> {
  const keys = allKeys();
  if (keys.length === 0) {
    throw new Error("MEMWAL_PRIVATE_KEY and MEMWAL_ACCOUNT_ID must be set in .env (see memory.walrus.xyz)");
  }
  const start = hash(userId) % keys.length;
  let lastErr: unknown;
  for (let i = 0; i < keys.length; i++) {
    try {
      return await fn(clientFor(keys[(start + i) % keys.length]));
    } catch (err) {
      lastErr = err;
      const status = (err as { status?: number })?.status;
      if (keys.length === 1 || (status !== 429 && status !== 401)) throw err;
    }
  }
  throw lastErr;
}

function userNamespace(userId: string) {
  return `duomind-${userId}`;
}

export async function rememberFact(userId: string, fact: string) {
  return withKey(userId, (m) => m.remember(fact, userNamespace(userId)));
}

export async function rememberFactAndWait(userId: string, fact: string) {
  return withKey(userId, (m) => m.rememberAndWait(fact, userNamespace(userId)));
}

export async function recallMemories(userId: string, query: string, limit = 8) {
  const result = await withKey(userId, (m) =>
    m.recall({ query, namespace: userNamespace(userId), limit })
  );
  return result.results ?? [];
}

export async function recallProfile(userId: string) {
  return recallMemories(userId, "partner's important dates, likes, dislikes, promises, plans, gift ideas", 6);
}
