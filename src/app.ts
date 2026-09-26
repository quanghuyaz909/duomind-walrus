import { Hono } from "hono";
import { cors } from "hono/cors";
import { handleMessage } from "./chat.js";

export const app = new Hono();

app.use("/api/*", cors());

app.post("/api/chat", async (c) => {
  const body = await c.req.json<{ userId?: string; message?: string }>().catch(() => null);
  if (!body?.userId || !body?.message) {
    return c.json({ error: "userId and message are required" }, 400);
  }
  try {
    const reply = await handleMessage(body.userId, body.message);
    return c.json({ reply });
  } catch (err) {
    console.error(err);
    return c.json({ error: "Failed to reach memory or the model." }, 500);
  }
});

app.get("/api/health", (c) => c.json({ ok: true }));
