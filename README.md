# DuoMind - A Relationship Memory Companion for Couples

A chatbot that remembers your partner's birthday, likes, dislikes, promises, plans, and
gift ideas - across sessions, permanently, on
[Walrus Memory](https://memory.walrus.xyz). Built for [Walrus Sessions 8](https://thewalrussessions.wal.app/).

- **LLM:** Groq (`qwen/qwen3.8-27b`) - not Claude or GPT.
- **Memory:** [`@mysten-incubation/memwal`](https://github.com/MystenLabs/MemWal), mainnet relayer.
- **Interface:** both a web chat UI and a Telegram bot, sharing the same recall ->
  generate -> learn pipeline and the same Walrus Memory namespace per user.

## How memory works

Every message runs a recall -> generate -> learn pipeline:

1. **Recall** - query the user's own Walrus Memory namespace (`duomind-<id>`) for facts
   relevant to the current message, plus a standing "profile" query (important dates,
   likes/dislikes, promises, plans, gift ideas).
2. **Generate** - the recalled facts are injected into the system prompt so the model
   answers grounded in what it actually remembers about *this* user's relationship, not
   generically.
3. **Learn** - after replying, durable facts (a birthday, a preference, a promise, a
   plan) are extracted and written as encrypted blobs to Walrus in the background; the
   user never waits on storage.

## Setup

### 1. Prerequisites
- Node.js 18+
- A Telegram bot token from [@BotFather](https://t.me/BotFather) (`/newbot`)
- A free Groq API key from [console.groq.com](https://console.groq.com)
- A Walrus Memory account (account ID + delegate private key) from
  [memory.walrus.xyz](https://memory.walrus.xyz) - requires a Sui wallet funded with a
  small amount of SUI (gas) and WAL (storage fees; mainnet writes are not free, but a
  handful of small text blobs cost well under $1).

### 2. Install
```bash
npm install
cp .env.example .env
```
Fill in `.env` with the four values above.

### 3. Verify credentials
```bash
npm run check
```
This makes one real Groq call and writes/reads one real memory blob on Walrus mainnet,
so you can confirm both integrations work before running the bot.

### 4. Run

**Web:**
```bash
npm run web
```
Open http://localhost:3000. Each browser gets a random anonymous id (stored in
`localStorage`) so memory is scoped per visitor without any login.

**Telegram:**
```bash
npm run dev
```
Message your bot on Telegram. `/start` for the intro. Memory is scoped per Telegram
user id, isolated from the web channel.

### 5. Deploy for free, 24/7 (Vercel)

Both the web UI and the Telegram bot can run on the same free Vercel deployment -
no machine needs to stay on.

```bash
npx vercel deploy --prod \
  -e GROQ_API_KEY=... \
  -e MEMWAL_PRIVATE_KEY=... \
  -e MEMWAL_ACCOUNT_ID=... \
  -e TELEGRAM_BOT_TOKEN=... \
  -e TELEGRAM_WEBHOOK_SECRET=some-random-string
```
`api/index.ts` exposes the same Hono app as a serverless function; `public/index.html`
is served as a static file automatically. `/api/telegram-webhook` handles Telegram
updates in webhook mode.

Point Telegram at the deployment once, after it's live:
```bash
npm run set-webhook -- https://your-deployment.vercel.app/api/telegram-webhook
```

**Local development** uses long polling instead (`npm run dev`, `src/telegram.ts`) -
Telegram only allows one delivery mode active per bot token at a time, so don't run
both against the same token simultaneously. Switch back to local polling by calling
`setWebhook` with an empty `url`, or just use a second bot token for local testing.

## Project structure

```
src/memory.ts    Walrus Memory (memwal) wrapper - remember/recall, per-user namespace
src/llm.ts       Groq client + system prompt
src/extract.ts   Extracts durable facts from a message via the LLM
src/chat.ts      recall -> generate -> learn pipeline (shared by both channels)
src/app.ts       Hono API (/api/chat) - shared by the local web server and Vercel
src/web.ts       Local web server entrypoint (serves public/ + the API)
src/telegram.ts  Telegram bot entrypoint (grammY, long polling)
src/check.ts     Credential/round-trip verification script
public/index.html  Web chat UI
api/index.ts     Vercel serverless entrypoint for the same Hono app
```

## Notes on the Walrus Sessions 8 requirements

- Every stored fact is a real blob written to Walrus **mainnet** via the delegate key
  in `.env` - verifiable on [walruscan.com](https://walruscan.com/mainnet).
- Memory is scoped per user (`duomind-<id>` namespace, `<id>` being a Telegram user id
  or a random web visitor id), so different couples/users never see each other's data.
- If Walrus Memory is unreachable, the bot still replies (without memory) rather than
  failing the whole conversation - recall/remember failures are caught and logged.

## License

MIT
