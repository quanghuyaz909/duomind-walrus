import "dotenv/config";
import { MemWal } from "@mysten-incubation/memwal";
import { recallMemories } from "./memory.js";

// Prints how many memories (blobs) each user namespace holds, with the account
// username next to web namespaces, and flags test accounts (username starting
// "qa_") so they are not counted as real users. Counts only, never memory text.
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

// namespace uuid -> username, from the accounts directory (username/namespace only)
const owner = new Map<string, string>();
for (const q of ["account", "ACCOUNT username namespace", "user", "qa", "test", "a", "e"]) {
  try {
    for (const m of await recallMemories("accounts-directory", q, 100)) {
      const u = m.text.match(/username=([^|]+)/)?.[1];
      const n = m.text.match(/namespace=([^|]+)/)?.[1];
      if (m.text.startsWith("ACCOUNT|") && u && n) owner.set(n, u);
    }
  } catch {}
}

type Kind = "real" | "test" | "internal";
function classify(ns: string): { kind: Kind; label: string } {
  if (ns === "duomind-accounts-directory") return { kind: "internal", label: "internal (accounts)" };
  const id = ns.replace(/^duomind-/, "");
  if (/^\d+$/.test(id)) return { kind: "real", label: "telegram user" };
  const uname = owner.get(id);
  const isTestName = /^(qa_|e2e_|claude_|tester|pushtest|stepstest|uitest|acctuser|prodtest|debug|huy$)/i.test(uname ?? "");
  if (uname) return isTestName ? { kind: "test", label: `web ${uname}` } : { kind: "real", label: `web ${uname}` };
  if (/^[0-9a-f-]{36}$/.test(id)) return { kind: "real", label: "web (username unknown)" };
  return { kind: "test", label: "test / other" };
}

rows.sort((a, b) => b.count - a.count);
console.log("memories  counts?  who");
let real10 = 0;
for (const r of rows) {
  const c = classify(r.name);
  if (c.kind === "internal" || (c.kind === "test" && r.count < 5)) continue;
  const counts = c.kind === "real" ? "REAL    " : "test    ";
  if (c.kind === "real" && r.count >= 10) real10++;
  console.log(`${String(r.count).padStart(8)}  ${counts}  ${c.label}`);
}
console.log(`\nTotal blobs (incl. my test accounts): ${rows.reduce((s, r) => s + r.count, 0)}`);
console.log(`REAL users with >= 10 memories: ${real10} (need 3)`);
