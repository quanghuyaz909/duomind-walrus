import "dotenv/config";

const token = process.env.TELEGRAM_BOT_TOKEN;
const url = process.argv[2];
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");
if (!url) {
  console.error("Usage: npm run set-webhook -- https://your-deployment.vercel.app/api/telegram-webhook");
  process.exit(1);
}

const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ url, secret_token: secret }),
});
console.log(await res.json());
