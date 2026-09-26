import { MemWal } from "@mysten-incubation/memwal";

let memwal: MemWal | null = null;

function getMemwal(): MemWal {
  if (memwal) return memwal;
  const key = process.env.MEMWAL_PRIVATE_KEY;
  const accountId = process.env.MEMWAL_ACCOUNT_ID;
  if (!key || !accountId) {
    throw new Error(
      "MEMWAL_PRIVATE_KEY and MEMWAL_ACCOUNT_ID must be set in .env (see memory.walrus.xyz)"
    );
  }
  memwal = MemWal.create({
    key,
    accountId,
    serverUrl: process.env.MEMWAL_SERVER_URL ?? "https://relayer.memory.walrus.xyz",
    namespace: "duomind",
  });
  return memwal;
}

function userNamespace(userId: string) {
  return `duomind-${userId}`;
}

export async function rememberFact(userId: string, fact: string) {
  return getMemwal().remember(fact, userNamespace(userId));
}

export async function rememberFactAndWait(userId: string, fact: string) {
  return getMemwal().rememberAndWait(fact, userNamespace(userId));
}

export async function recallMemories(userId: string, query: string, limit = 8) {
  const result = await getMemwal().recall({
    query,
    namespace: userNamespace(userId),
    limit,
  });
  return result.results ?? [];
}

export async function recallProfile(userId: string) {
  return recallMemories(userId, "partner's important dates, likes, dislikes, promises, plans, gift ideas", 6);
}
