# Bug report + improvement idea (for the Walrus Sessions 8 form)

Checked on 2026-10-04 against `@mysten-incubation/memwal` 0.1.8 (latest on npm).

## Honest status of the SDK config-validation bug

I originally planned to file `MemWal.create()` accepting bad config as a new issue. It
is already reported upstream as
[MystenLabs/MemWal#1041](https://github.com/MystenLabs/MemWal/issues/1041) (open, no
maintainer reply yet), which covers `key: undefined` and `key: ""` ("hexToBytes: empty
hex string"). Filing a duplicate would not count for the Bug Bounty, so don't.

One small thing #1041 does not cover - a candidate for a **comment on #1041**, not a new
issue (reproduced, 0.1.8, Node v24.18.0, Windows 10):

```js
MemWal.create({ key: validKey, accountId: "" });        // no error
MemWal.create({ key: validKey, accountId: undefined }); // no error
await memwal.recall({ query: "x" });
// -> "401 from relayer: typically wrong private key, key not registered on this
//    account, account ID mismatch, or staging/mainnet mismatch ..."
```

An empty/undefined `accountId` is accepted at construction and only surfaces as a
generic multi-cause 401 on first use, same failure shape as the `key` case in #1041.
Suggested: validate `accountId` (non-empty, `0x` + hex) in `create()` too.

## Bug to put in the form (found while actually using it)

Use a real one from this project's own use if the form asks for "a bug you hit". The
best real one: `remember()` returns as soon as the job is *accepted*, and the docs do not
warn that on serverless platforms (Vercel Node functions) a detached `remember()` /
background chain started after the handler returns can be frozen before it runs. In my
bot, facts the user told it were silently never stored; replies still said "got it".
Not an SDK defect strictly (my bug), but a documentation gap that cost real debugging
time. Only call it a "bug" in the form if you phrase it as a docs/behavior gap.

## Improvement idea (for the form)

Add a short "Serverless / write-lag" note to the Quick Start:

1. `remember()` only guarantees the job is accepted; a fact can take ~15-30s to become
   recallable, so "remember then immediately recall" can miss it.
2. On serverless, `await` the `remember()` call (the fast accepted call) before
   returning the response - do not leave it detached.
3. State the rough WAL/SUI needed to create an account and write a first blob, and that
   blobs written through the hosted relayer are held by the relayer's wallet, so
   searching walruscan by your own address shows "0 blobs" (look up by blob ID).

## Do NOT post anything yourself without checking

Commenting on #1041 is public and posts from your GitHub account - your call, not
automatic.
