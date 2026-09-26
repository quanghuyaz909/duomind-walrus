import "dotenv/config";
import { chatComplete } from "./llm.js";
import { rememberFactAndWait, recallMemories } from "./memory.js";

async function main() {
  console.log("Checking Groq...");
  const reply = await chatComplete([{ role: "user", content: "Reply with exactly: ok" }]);
  console.log("  Groq reply:", reply);

  console.log("Checking Walrus Memory (this writes 1 real blob)...");
  const testUser = "check-script";
  const job = await rememberFactAndWait(testUser, "Setup check ran successfully.");
  console.log("  Wrote memory job:", job);

  const memories = await recallMemories(testUser, "setup check");
  console.log("  Recalled:", memories);

  console.log("\nAll checks passed.");
}

main().catch((err) => {
  console.error("Check failed:", err);
  process.exit(1);
});
