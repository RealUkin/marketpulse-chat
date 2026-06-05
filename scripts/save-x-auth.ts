// One-time helper: log into your BURNER X account and save the session to x-auth.json.
// Run:  npm run x:login
// X killed guest-token access in 2023, so reading live chat needs a logged-in session.
// Use a throwaway account, never your main — there is a small ToS/ban risk.
import { chromium } from "playwright";

const browser = await chromium.launch({ headless: false });
const ctx = await browser.newContext();
const page = await ctx.newPage();
await page.goto("https://x.com/login");

console.log("\n  → Log into your BURNER X account in the browser window.");
console.log("  → Once your timeline is loaded, press ENTER here to save the session.\n");

process.stdin.resume();
process.stdin.once("data", async () => {
  await ctx.storageState({ path: "x-auth.json" });
  console.log("\n  ✓ Saved x-auth.json — the X adapter will use it automatically.\n");
  await browser.close();
  process.exit(0);
});
