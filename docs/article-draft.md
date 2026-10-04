# DuoMind: Giving Couples a Chatbot That Actually Remembers Each Other

*Built for Walrus Sessions 8 - "Chatbots That Remember"*

## The problem

Every general-purpose chatbot has the same failure mode: close the tab, lose the
context. Tell it your partner's birthday today, and by next week - or next
conversation - it has no idea. For something as personal as a relationship, that's the
opposite of useful: the value is in remembering what you told it *last time*, not in
answering the same "tell me about them" question over and over.

## What DuoMind does

DuoMind is a small chatbot - available as both a web chat and a Telegram bot - that
keeps track of your partner and your relationship the way a thoughtful friend with a
perfect memory would:

- Tell it your partner's birthday, likes, dislikes, an inside joke, a promise you made,
  or a gift idea you just thought of.
- Ask it for a date idea or a gift suggestion, and it grounds the answer in what it
  actually remembers about your specific relationship - not generic advice.
- It never invents history - if it has no relevant memory, it says so instead of
  guessing.

Under the hood, every message runs a **recall -> generate -> learn** loop:

1. **Recall** - query the user's own [Walrus Memory](https://memory.walrus.xyz)
   namespace for anything relevant to the current message, plus a standing "profile"
   query (important dates, likes/dislikes, promises, plans, gift ideas).
2. **Generate** - those recalled facts get injected into the system prompt before the
   model (Groq, Qwen) answers, so the response is grounded in *this* user's actual
   relationship, not a template.
3. **Learn** - after replying, the bot extracts durable facts from the message (a
   birthday, a preference, a promise, a plan) and writes them to Walrus as encrypted
   blobs. The write is the fast "job accepted" call, so the user waits for the
   extraction, not for Walrus to finish indexing (that part takes a while longer, see
   below).

## Before / after

**Before (no memory):**
> Me: "What should I get her for our anniversary?"
> Bot: "I don't know anything about her - what does she like?"
*(every single time, forever)*

**After (Walrus Memory):**
> Me: "What should I get her for our anniversary?"
> Bot: "You mentioned she's been wanting that pottery class, and last month you said
> she loves anything handmade over store-bought - a couples pottery session might land
> better than another gift."

The difference isn't the model getting smarter - it's the same Qwen call. The
difference is *state*. Because that state lives on Walrus rather than in a database I
control, it persists even if I redeploy, restart, or lose my server.

## Integrating Walrus Memory

Integration was three files: a thin wrapper around `@mysten-incubation/memwal`
(remember/recall, namespaced per user), a fact-extraction step that turns a raw message
into short durable statements, and a pipeline that ties recall/generate/learn together.
Memory is scoped per user (`duomind-<id>`) so different couples' data never mixes, even
though they share the same delegate key server-side.

The one piece of real friction: the SDK client throws immediately if the delegate key
or account ID is missing or malformed, which meant the whole server (web *and*
Telegram) crashed on boot before a single request came in - even for routes that don't
touch memory. I switched to lazy initialization so the client is only constructed on
first actual use, and a missing/invalid credential now surfaces as a clear runtime
error on the specific request that needed memory, not a boot-time crash.

## Add Walrus Memory to your own chatbot in ~20 lines

If you're new to this, here is the whole integration, copied from this project:

1. Create a Walrus Memory account at [memory.walrus.xyz](https://memory.walrus.xyz) and
   create a delegate key. You get an **account ID** and a **delegate private key**.
   Writing on mainnet needs a little SUI (gas) and WAL (storage) in the wallet; a handful
   of small text blobs cost well under a dollar.
2. `npm install @mysten-incubation/memwal`
3. Wrap it once, one namespace per end user so people never see each other's memories:

```ts
import { MemWal } from "@mysten-incubation/memwal";

const memwal = MemWal.create({
  key: process.env.MEMWAL_PRIVATE_KEY!,
  accountId: process.env.MEMWAL_ACCOUNT_ID!,
  serverUrl: "https://relayer.memory.walrus.xyz", // mainnet
});
const ns = (userId: string) => `myapp-${userId}`;

export const remember = (userId: string, fact: string) => memwal.remember(fact, ns(userId));
export const recall = async (userId: string, query: string) =>
  (await memwal.recall({ query, namespace: ns(userId), limit: 8 })).results;
```

4. Before each model call, `recall()` and put the results in the system prompt. After the
   reply, extract short durable facts from the user's message and `remember()` them.

Three things I wish I'd known on day one:

- `remember()` returns when the job is *accepted*; the fact can take ~15-30s to become
  recallable.
- On serverless (Vercel), `await` the `remember()` call before you return the response.
  A detached promise can be frozen before it ever runs.
- Construct the client lazily, so a missing key fails the one request that needs memory
  instead of crashing your whole server at boot.

## Evidence of real use

A real session on the live deployment, word for word:

> Me: "My partner's name is Mai. Her birthday is October 14th and she loves cats and
> oolong tea."
> Bot: "Got it! I've noted that Mai's birthday is October 14th, and that she loves
> cats and oolong tea. I'll keep these details in mind for future reminders or gift
> ideas."
>
> *(a little later, same session)*
>
> Me: "What do you remember about Mai?"
> Bot: "I remember that Mai's birthday is on October 14. I also know that she loves
> oolong tea and cats."

Not a canned demo - a real blob written during that exchange, verifiable on-chain:
[walruscan.com/mainnet/blob/R_769AkRK2bTBr_S98-OkhxQ4AzYw_FAh-jmEzQzBLM](https://walruscan.com/mainnet/blob/R_769AkRK2bTBr_S98-OkhxQ4AzYw_FAh-jmEzQzBLM)
- `seal_encrypt_fence`, `certify_blob`, and `redeem_funds` transactions, all real, all
  on mainnet.

## What I'd improve

**Fire-and-forget breaks on serverless.** The learn step (extract facts -> write to
Walrus) originally ran as a detached promise after the reply was already prepared -
totally normal on a long-running Node server, where the event loop just keeps going
after the response is sent. On Vercel's serverless runtime it's not safe: the
function's execution context can be frozen the moment it returns, with no guarantee a
detached background call ever finishes - or even starts. I only found this by actually
using the deployed bot: I'd tell it something, and a few messages later in the *same
session*, ask what it remembered - nothing, no matter how long I waited. The reply
itself never depended on that background work, so everything *looked* fine until the
next question exposed that nothing had actually been saved. Fix was to await it. A
local dev server would never have caught this.

**Verifying your own data on walruscan is non-obvious.** Searching walruscan for my
own account/owner address shows "0 blobs found" - because the hosted relayer signs
storage transactions from its own pooled wallet, not the end user's address. The blob
above is real and mine, but you can only find it by blob ID, not by looking up "my"
account. A little confusing the first time; worth a line in the docs.

**Write-lag is real.** `remember()` only guarantees the job was accepted; a fact can
take roughly 15-30 seconds to become recallable. Telling the bot something and asking
about it two seconds later can miss. For a relationship journal that's tolerable (you
rarely ask about a fact the instant you state it), but I'd like the SDK to expose a
cheap "is it indexed yet" signal so apps can bridge the gap instead of guessing.

**One delegate key, 60 requests a minute.** The hosted relayer rate-limits per delegate
key (60 weighted requests/min, I hit a 429 while stress-testing). Because my app uses one
key for every end user and a chat message costs roughly 3-5 requests (two recalls plus
writes), the whole app tops out around a dozen messages a minute. Fine for a couple's
journal, but anyone building a busier bot will want per-user keys or a documented way to
raise the limit.

## Try it

- Web: [walrus-memory-chatbot.vercel.app](https://walrus-memory-chatbot.vercel.app)
- Telegram: [@DuoMindd_bot](https://t.me/DuoMindd_bot)
- Source: [github.com/quanghuyaz909/duomind-walrus](https://github.com/quanghuyaz909/duomind-walrus)

---

*Built with Groq (Qwen - not Claude or GPT) and
[`@mysten-incubation/memwal`](https://github.com/MystenLabs/MemWal) on Walrus mainnet.*
