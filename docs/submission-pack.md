# Submission pack - Walrus Sessions 8 (deadline 2026-10-09, 2:00 PM UTC)

Everything below is ready to copy-paste. Items marked YOU need your own account, wallet
or a public post, so they cannot be done for you.

## Project facts

| Field | Value |
|---|---|
| Name | DuoMind |
| One-liner | A relationship memory companion for couples that remembers birthdays, likes, promises and plans across sessions and devices, on Walrus Memory (mainnet). |
| Repo (public) | https://github.com/quanghuyaz909/duomind-walrus |
| Web | https://walrus-memory-chatbot.vercel.app |
| Telegram | https://t.me/DuoMindd_bot |
| LLM used | Qwen (`qwen/qwen3.8-27b`) via Groq - not Claude, not GPT (eligible for "Beyond the Big Two") |
| Memory | `@mysten-incubation/memwal` 0.1.8, mainnet relayer `https://relayer.memory.walrus.xyz` |
| Blobs on mainnet | 29 (counted 2026-09-28 via `listNamespaces()` memory_count, across 13 namespaces; requirement is 10+) |
| Example blob | https://walruscan.com/mainnet/blob/R_769AkRK2bTBr_S98-OkhxQ4AzYw_FAh-jmEzQzBLM |
| Dedicated Sui wallet (prize) | `0x87412d5420c4f4213cbdc3ecce36ea4238588323fae9ddfd683f20f3004ab336` |
| Article | docs/article-draft.md (publish on Medium or Inkray, then put the link here) |

Honest note on the 29: it includes my own test namespaces from building the app. Use the
app yourself for the next few days so the count of *real* use is clearly above 10 too.

## Where to submit (verified against the official rules page on 2026-10-04)

1. **DeepSurge** - register + project page: https://www.deepsurge.xyz/hackathons/c0141a4a-21be-4009-bc63-7c168608c849
2. **Airtable submission form (submit once)**: https://airtable.com/appoDAKpC74UOqoDa/shro5iVzzjoWfZlPK
3. Only needed if NOT submitting the full chatbot (a full submission puts the promo link in
   the Airtable form instead):
   - Bug-bounty-only: https://walform.wal.app/f?formId=0x38a736485349b133604c1caf286d669b4b774d16f0a26120ce839cad245baeef
   - Promo-only: https://walform.wal.app/f?formId=0x09b022796f9cb7ce24247e3097c5c8ae2b414317c90c8aeb6ce335e7caf31ff5
4. Discord (required): https://discord.com/invite/walrusprotocol

Proof the rules ask for: **agent ID + blob count**. Walrus Memory account ID:
`0x6046873c2a4815efa85c16f884b086a23f033a9c4569274cfcaec6b470fb7975`, blob count 29
(verify the exact field wording in the form; if unsure, put the account ID and say it is
the Walrus Memory account object ID).

Session announcement post (reply or quote this one): https://x.com/WalrusProtocol/status/2101011483379585088

The X post must be posted **under the Session announcement** (reply or quote it), tagging
@WalrusProtocol with #WalrusMemory. Promo posts: not X, not r/sui, not r/walrus, not any
Walrus/Sui channel.

## Form answers

**Chatbot description:**
DuoMind is a chatbot for couples. You tell it about your partner (birthday, likes,
promises, plans, gift ideas) and it remembers permanently on Walrus Memory, across
sessions and devices, then grounds gift and date suggestions in what it actually knows.
Every message runs recall -> generate -> learn: it recalls the user's own memory
namespace, injects it into the prompt, then extracts new durable facts and stores them as
encrypted blobs. It runs on the web and Telegram (shared memory via a /link code),
supports 7 languages, resolves relative dates ("next Monday"), and sends birthday and
anniversary reminders (Telegram message or browser push).

**Bug (1):**
Found by real use, not an SDK defect: a detached `remember()` call (started after the
HTTP handler returned) can be frozen by Vercel's Node serverless runtime before it ever
runs. The bot kept answering "got it" but nothing was stored, so asking about it later
returned nothing. Fixed by awaiting the (fast) `remember()` call before responding.
Related SDK-side note: `MemWal.create()` accepts an empty/undefined `accountId` with no
error and only fails later with a generic 401 (same shape as the already-open
https://github.com/MystenLabs/MemWal/issues/1041 for `key`).

**Improvement idea (1):**
Add a "Serverless and write-lag" note to the Quick Start: (a) `remember()` only
guarantees the job was accepted and a fact can take ~15-30s to become recallable; (b) on
serverless, await `remember()` before returning, never leave it detached; (c) state the
rough SUI/WAL needed for a first blob, and that blobs written through the hosted relayer
are held by the relayer's wallet, so searching walruscan by your own address shows "0
blobs" (look up by blob ID instead). A cheap "is this indexed yet" signal in the SDK
would also remove most of the guesswork.

**Integration friction (rules ask you to document it for the alternative-model prize):**
Groq's free tier caps Qwen at 1000 output tokens/minute; a single verbose reply
requested 1407 and got a 429. Fixed by capping `max_tokens` and, when a reply is cut
off, making one "continue" call and sending the pieces as two messages. Groq also no
longer serves the Llama chat models on this key, so the default model had to move to
Qwen.

## X post (YOU post it, after the article is live)

```
Built DuoMind for #WalrusMemory @WalrusProtocol - a chatbot for couples that actually
remembers: birthdays, likes, promises, plans. Same memory on web + Telegram, stored as
encrypted blobs on Walrus mainnet.

Qwen via Groq (no Claude/GPT). Wrote up the before/after + the serverless bug that
silently ate my memories: <ARTICLE LINK>

Try it: https://walrus-memory-chatbot.vercel.app
Repo: https://github.com/quanghuyaz909/duomind-walrus
```

## Checklist

Done (by me):
- [x] Chatbot deployed live on mainnet (web + Telegram), public repo, README
- [x] Non-Anthropic/OpenAI model, integration friction documented
- [x] 10+ blobs on mainnet (29)
- [x] Article drafted with real before/after and real walruscan blob link
- [x] Bug + improvement idea written, duplicate SDK bug avoided

Needs YOU:
- [ ] Use the app yourself (and ideally 1-2 friends) for a few days with real details
- [ ] Re-read the article, fix the tone, publish on Medium or Inkray, copy the link
- [ ] Post on X (tag @WalrusProtocol, #WalrusMemory) using the text above
- [ ] Join the Walrus Discord
- [ ] Register on DeepSurge and submit the form (answers above)
- [ ] Have a dedicated Sui wallet address ready for the prize (rules require one)
- [ ] Optional: comment on MemWal#1041 about `accountId`
- [ ] Optional ($100 Promo prize): post about the Session in a third-party community
      (subreddit/forum/newsletter - X and Walrus/Sui channels do not count)

Links: details https://www.deepsurge.xyz/hackathons/c0141a4a-21be-4009-bc63-7c168608c849
- rules https://thewalrussessions.wal.app/ - MemWal repo https://github.com/MystenLabs/MemWal
