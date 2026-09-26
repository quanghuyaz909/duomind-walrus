# Draft GitHub issue for MystenLabs/MemWal

**Title:** `MemWal.create()` throws an unhelpful low-level error when `key` is empty/missing

**Body:**

### Description
When `MemWalConfig.key` is an empty string (e.g. an unset environment variable read
straight into config, `process.env.MEMWAL_PRIVATE_KEY` with no `.env` value set), the
SDK throws deep inside `hexToBytes` instead of validating config up front with a
message that names the offending field.

### Repro
```ts
import { MemWal } from "@mysten-incubation/memwal";

const memwal = MemWal.create({
  key: "", // e.g. an unset env var
  accountId: "some-account-id",
});
```

### Actual
```
Error: hexToBytes: empty hex string
    at hexToBytes (.../memwal/dist/utils.js:47:15)
    at new MemWal (.../memwal/dist/memwal.js:258:19)
    at MemWal.create (.../memwal/dist/memwal.js:280:16)
```
The stack trace gives no indication that `key` (vs. `accountId`, `serverUrl`, etc.) is
the problem, and nothing in the message names the config field. In an app that
constructs the client at module load (a common pattern shown in the SDK's own
quickstart example), this crashes the whole process before any request is served,
which made the root cause non-obvious until we added our own explicit validation in
front of `MemWal.create()`.

### Expected
`MemWal.create()` validates `key` (and ideally `accountId`) before attempting to parse
them, and throws something like:
`Error: MemWalConfig.key is required (got empty string) — pass the Ed25519 delegate
private key`

### Environment
- `@mysten-incubation/memwal`: 0.1.8
- Node.js: v24.18.0
- OS: Windows 10

### Improvement idea (separate from the bug)
The [Quick Start docs](https://docs.wal.app/walrus-memory/getting-started/quick-start)
don't state the minimum SUI (gas) / WAL (storage) a fresh wallet needs to create an
account and write its first blob on mainnet. First-time users have no way to know
"is a few cents enough?" without trial and error — a one-line estimate (or a link to
current mainnet storage pricing) would remove that guesswork.

---
*(Post this to https://github.com/MystenLabs/MemWal/issues once you've reproduced it
yourself with your real credentials — the hackathon rules require it be a reproducible
issue you filed, with repro steps and environment details.)*
