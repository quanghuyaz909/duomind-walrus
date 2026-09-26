# TradeMind: Giving a Trading Journal Bot a Memory That Doesn't Reset

*Built for Walrus Sessions 8 — "Chatbots That Remember"*

## The problem

Every trading-journal chatbot I'd used before had the same failure mode: close the tab,
lose the context. Ask it "what was my thesis on that SOL trade two weeks ago?" and it
has no idea — every session starts from zero. For a trader, that's the opposite of
useful: journaling only pays off if the assistant remembers what you told it *last time*.

## What TradeMind does

TradeMind is a small chatbot — available as both a web chat and a Telegram bot — that
lets you talk through your trades the way you'd talk to a mentor who's been watching
your account for months:

- Tell it your strategy, risk tolerance, or a trade you just took (symbol, entry price,
  thesis).
- Ask it for a gut-check on a new idea, and it pulls up what it remembers: your stated
  risk tolerance, similar past trades, lessons you already wrote down.
- It never invents history — if it has no relevant memory, it says so instead of
  guessing.

Under the hood, every message runs a **recall → generate → learn** loop:

1. **Recall** — query the user's own [Walrus Memory](https://memory.walrus.xyz)
   namespace for anything relevant to the current message, plus a standing "profile"
   query (strategy, risk tolerance, watchlist, lessons learned).
2. **Generate** — those recalled facts get injected into the system prompt before the
   model (Groq, Llama 3.3) answers, so the response is grounded in *this* user's actual
   history, not a generic template.
3. **Learn** — after replying, the bot extracts durable facts from the message (a new
   entry/exit, a strategy change, a lesson) and writes them as encrypted blobs to Walrus
   in the background. The user never waits on storage.

## Before / after

**Before (no memory):**
> Me: "I'm thinking of shorting ETH here, thoughts?"
> Bot: "I don't have context on your portfolio or risk tolerance — can you tell me more?"
*(every single time, forever)*

**After (Walrus Memory):**
> Me: "I'm thinking of shorting ETH here, thoughts?"
> Bot: "You told me last week your max position size is 5% of the book and you got
> burned shorting into a squeeze back in [month] — worth checking funding rates before
> sizing this one the same way."

The difference isn't the model getting smarter — it's the same Llama 3.3 call. The
difference is *state*. And because that state lives on Walrus rather than in a database
I control, the user's history persists even if I redeploy, restart, or lose my server.

## Integrating Walrus Memory

Integration was three files: a thin wrapper around `@mysten-incubation/memwal`
(remember/recall, namespaced per user), a fact-extraction step that turns a raw message
into short durable statements, and a pipeline that ties recall/generate/learn together.
Memory is scoped per user (`trademind-<id>`) so two people's trading data never mixes,
even though they share the same delegate key server-side.

The one piece of real friction: the SDK client throws immediately if the delegate key
or account ID is missing or malformed, which meant the whole server (web *and*
Telegram) crashed on boot before a single request came in — even for routes that don't
touch memory. I switched to lazy initialization so the client is only constructed on
first actual use, and a missing/invalid credential now surfaces as a clear runtime
error on the specific request that needed memory, not a boot-time crash.

## Evidence of real use

*(fill in after a few days of real usage: number of blobs written, walruscan.com links,
screenshots, a couple of real before/after exchanges with actual trades)*

## What I'd improve

*(fill in: friction points found while actually using it day to day)*

## Try it

- Web: *(deployed URL)*
- Telegram: *(bot link)*
- Source: *(GitHub repo URL)*

---

*Built with Groq (Llama 3.3 — not Claude or GPT) and
[`@mysten-incubation/memwal`](https://github.com/MystenLabs/MemWal) on Walrus mainnet.*
