// Shared Playwright browser provider — used by the X adapter (WS interception)
// and the Kick adapter's Cloudflare fallback.
import { chromium, type Browser, type BrowserContext } from "playwright";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const X_AUTH_PATH = resolve(process.cwd(), "x-auth.json");
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export function hasXAuth(): boolean {
  return existsSync(X_AUTH_PATH);
}

let headfulBrowser: Promise<Browser> | null = null;
let headlessBrowser: Promise<Browser> | null = null;

function launch(headless: boolean): Promise<Browser> {
  return chromium.launch({
    headless,
    args: ["--disable-blink-features=AutomationControlled"],
  });
}

/** Context for X: logged-in burner session (storageState), headful by default (X flags headless). */
export async function newXContext(): Promise<BrowserContext> {
  const headless = process.env.X_HEADLESS === "1";
  headfulBrowser ??= headless ? null : launch(false);
  headlessBrowser ??= headless ? launch(true) : null;
  const browser = await (headless ? headlessBrowser! : headfulBrowser!);
  return browser.newContext({
    userAgent: UA,
    ...(hasXAuth() ? { storageState: X_AUTH_PATH } : {}),
  });
}

/** Lightweight headless context for API fetches (e.g. Kick Cloudflare bypass). */
export async function newPlainContext(): Promise<BrowserContext> {
  headlessBrowser ??= launch(true);
  const browser = await headlessBrowser;
  return browser.newContext({ userAgent: UA });
}

export async function closeBrowsers(): Promise<void> {
  for (const p of [headfulBrowser, headlessBrowser]) {
    if (p) {
      try {
        (await p).close();
      } catch {
        /* noop */
      }
    }
  }
  headfulBrowser = null;
  headlessBrowser = null;
}
