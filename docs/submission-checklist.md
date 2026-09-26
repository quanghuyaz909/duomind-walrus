# Walrus Sessions 8 submission checklist

Deadline: **Oct 9, 2026, 2:00 PM UTC**

## Things only you can do (need your own accounts/wallet)

- [ ] Get Telegram bot token from @BotFather -> put in `.env`
- [ ] Get Groq API key from console.groq.com -> put in `.env`
- [ ] Create Walrus Memory account + delegate key at memory.walrus.xyz (wallet needs
      SUI for gas + WAL for storage) -> put in `.env`
- [ ] Run `npm run check` - confirms both Groq and Walrus Memory work, writes 1 real blob
- [ ] Install Git for Windows (not currently installed on this machine), then:
  - [ ] `git init`, `git add -A`, `git commit`
  - [ ] Create a **public** GitHub repo, push
- [ ] Register the project on DeepSurge (project name, description, contact, GitHub)
- [ ] Deploy the web UI (Vercel free tier - see README §5) and/or run the Telegram bot
      somewhere it stays up (a free-tier VM, or your own machine, for the polling process)
- [ ] Use it for real, a few days - actual details about your partner/relationship,
      not test messages, ideally with your partner or friends trying it too - this is
      what "Real-World Use" is judged on
- [ ] Confirm ≥10 real blobs written on mainnet before submitting - check via
      walruscan.com/mainnet with your account address
- [ ] Get a dedicated Sui wallet address ready for the Session (for potential prize payout)
- [ ] File the bug report at github.com/MystenLabs/MemWal/issues - draft in
      `docs/bug-report-draft.md`, reproduce it yourself first
- [ ] Fill in the "Evidence of real use" and "What I'd improve" sections in
      `docs/article-draft.md` with real screenshots/numbers, then publish on Medium or Inkray
- [ ] Post on X tagging @WalrusProtocol with #WalrusMemory - draft in `docs/x-post-draft.md`
- [ ] Join the Walrus Discord
- [ ] Submit via the DeepSurge form: repo link, LLM used (Groq/Llama 3.3), 1 bug, 1
      improvement idea
- [ ] (Optional, extra prize) Fill the Promo form if you share the session in an
      external community (subreddit/forum/newsletter - not X or Walrus/Sui channels)

## Already done

- [x] Chatbot built: web chat UI + Telegram bot, shared backend
- [x] Walrus Memory integration (recall -> generate -> learn pipeline)
- [x] Non-Anthropic/OpenAI model (Groq/Llama 3.3) - eligible for "Beyond the Big Two"
- [x] Per-user memory isolation (namespace per user id)
- [x] README with full setup instructions
- [x] Article draft, X post draft, bug report draft
