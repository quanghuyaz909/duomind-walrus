# How I built a chatbot that remembers you between sessions (Walrus Memory + Qwen on Groq)

*Built for Walrus Sessions 8, "Chatbots That Remember"*

## The problem

Tell a chatbot your partner's birthday today and by next week it has no idea. For something
as personal as a relationship that's the whole point lost: the value is in the bot
remembering what you told it *last time*, not asking "tell me about them" again.

## What DuoMind does

DuoMind is a chatbot for couples, on the web and on Telegram. You tell it about your
partner (birthday, likes, a promise, a plan) and it remembers permanently. Ask for a gift or
date idea later and the answer is grounded in what it actually knows. It works in 7
languages, understands "next Wednesday", and sends a reminder before a birthday.

## How Walrus Memory is wired in

Every message runs the same loop, with one namespace per user so memories never mix:

1. **Recall**: query that user's namespace for facts relevant to the message.
2. **Generate**: put the recalled facts in the prompt, then answer (Qwen via Groq).
3. **Learn**: ask the model to extract short durable facts from the message (a date, a
   preference, a promise) and `remember()` each one as an encrypted blob.

```ts
const memwal = MemWal.create({ key, accountId, serverUrl: "https://relayer.memory.walrus.xyz" });
await memwal.remember("Lan loves sunflowers", `myapp-${userId}`);
const hits = (await memwal.recall({ query, namespace: `myapp-${userId}`, limit: 8 })).results;
```

Accounts live on Walrus too: a username maps to a stable namespace plus a password hash,
so a password reset (via a Telegram chat attached earlier) keeps the same memory.

## Before and after

Without memory, "what should I get her for our anniversary?" gets "I don't know anything
about her, what does she like?" every single time. With memory, a test account that had
been told about "Lan" answered a later question with:

> "I remember that your girlfriend Lan has a birthday on November 2nd. I also know that she
> loves sunflowers."

Same model, same prompt. The only difference is state, and it lives on Walrus rather than
in a database I run, so redeploying or losing my server doesn't erase it.

## Evidence of real use

**[REPLACE BEFORE PUBLISHING with your real numbers: how many days, how many real users,
memories per user, and 1-2 real screenshots of the bot recalling something from an earlier
session. Say plainly if most use came from one person.]**

A live blob on mainnet: [walruscan.com/mainnet/blob/R_769AkRK2bTBr_S98-OkhxQ4AzYw_FAh-jmEzQzBLM](https://walruscan.com/mainnet/blob/R_769AkRK2bTBr_S98-OkhxQ4AzYw_FAh-jmEzQzBLM).

## What broke (and what I'd improve)

- **A detached `remember()` silently never ran.** I started the "learn" step after the
  reply was ready. On Vercel's serverless runtime the function can be frozen the moment it
  returns, so facts were never stored while the bot kept saying "got it". I only caught it
  by using the deployed bot: tell it something, ask a few messages later, nothing. Fix:
  `await` it. A local dev server would never have shown this.
- **Write-lag.** `remember()` returns when the job is accepted; a fact can take ~15-30s to
  become recallable. A cheap "is it indexed yet" signal in the SDK would help.
- **60 weighted requests/min per delegate key.** I measured it: with one key for all users,
  the whole app sustains only about 8 chat messages a minute (each message costs a couple of
  recalls plus a write per extracted fact). Past that you get a 429, and I had to make sure the
  bot says "I couldn't save that" instead of pretending it did. Extra delegate keys on the same
  account raise the ceiling, but it would be nicer to have this documented up front.
- **walruscan shows "0 blobs" for my own address**, because the hosted relayer signs from
  its own wallet. Look blobs up by ID.
- **Groq's free tier** caps Qwen at 1000 output tokens/minute. One verbose reply got a
  429, so I cap `max_tokens` and send a long answer as two messages.

## Try it

Web: https://walrus-memory-chatbot.vercel.app, Telegram: https://t.me/DuoMindd_bot,
code: https://github.com/quanghuyaz909/duomind-walrus

*Model: Qwen (`qwen/qwen3.8-27b`) on Groq, not Claude or GPT. Memory: `@mysten-incubation/memwal` on mainnet.*
