import "dotenv/config";
import { MemWal } from "@mysten-incubation/memwal";

// Prints how many memories (blobs) each user namespace holds. Shows counts only,
// never the memory text. Useful for checking the "3 users x 10 memories" bar.
const memwal = MemWal.create({
  key: process.env.MEMWAL_PRIVATE_KEY!,
  accountId: process.env.MEMWAL_ACCOUNT_ID!,
  serverUrl: process.env.MEMWAL_SERVER_URL ?? "https://relayer.memory.walrus.xyz",
});

const rows: { name: string; count: number }[] = [];
let cursor: string | undefined;
let more = true;
while (more) {
  const page = await memwal.listNamespaces({ cursor });
  for (const ns of page.namespaces) rows.push({ name: ns.name, count: ns.memory_count });
  cursor = page.next_cursor ?? undefined;
  more = page.has_more;
}

const kind = (n: string) =>
  n === "duomind-accounts-directory" ? "internal (accounts)" :
  /^duomind-\d+$/.test(n) ? "telegram user" :
  /^duomind-[0-9a-f-]{36}$/.test(n) ? "web account" :
  "test / other";

rows.sort((a, b) => b.count - a.count);
console.log("memories  kind                  namespace");
for (const r of rows) console.log(`${String(r.count).padStart(8)}  ${kind(r.name).padEnd(20)}  ${r.name}`);
const real = rows.filter((r) => ["telegram user", "web account"].includes(kind(r.name)));
console.log(`\nTotal blobs: ${rows.reduce((s, r) => s + r.count, 0)}`);
console.log(`User namespaces with >= 10 memories: ${real.filter((r) => r.count >= 10).length} (need 3)`);
