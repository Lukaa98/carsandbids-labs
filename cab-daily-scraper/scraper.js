// scraper.js
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs/promises";
import path from "path";
import { collectListingEntries } from "./url-collector.js";
import { enrichOne } from "./detail-extractor.js";
import { sleep } from "./utils.js";

puppeteer.use(StealthPlugin());

const OUTPUT_DIR = path.resolve("./output");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "results.json");
const MAX_URLS = 50;
const PER_PAGE_DELAY_MS = 1500; // between pages
const BETWEEN_ENRICH_MS = 2000 + Math.floor(Math.random() * 2000); // jitter

async function ensureOutput() {
  try {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
  } catch (e) {
    /* ignore */
  }
  // initialize file if not exists
  try {
    await fs.access(OUTPUT_FILE);
  } catch {
    await fs.writeFile(OUTPUT_FILE, JSON.stringify([], null, 2));
  }
}

async function readResults() {
  try {
    const txt = await fs.readFile(OUTPUT_FILE, "utf8");
    return JSON.parse(txt || "[]");
  } catch {
    return [];
  }
}

async function appendResult(r) {
  const arr = await readResults();
  arr.push(r);
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(arr, null, 2));
}

async function main() {
  console.log("[C&B Scraper] Starting local run ✅");
  await ensureOutput();

  const browser = await puppeteer.launch({
    headless: false, // visible so you can solve CF challenge
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", // keep this if on Windows; otherwise remove to use bundled
    userDataDir: "./cb-profile",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--disable-infobars",
      "--window-size=1366,768",
      "--start-maximized",
      "--password-store=basic",
      "--use-mock-keychain",
    ],
    defaultViewport: null,
  });

  const page = await browser.newPage();

  // real-ish UA and headers
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
  );
  await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });

  // Visit the listing page to collect URLs
  console.log("🌐 Loading listing page...");
  await page.goto("https://carsandbids.com/past-auctions/", {
    waitUntil: "domcontentloaded",
    timeout: 90000,
  });

  // Detect Cloudflare / interstitial
  let title = await page.title();
  if (title.includes("Just a moment") || title.includes("Verify")) {
    console.log("🚨 Cloudflare challenge detected on listing page.");
    console.log("➡️ Please complete the challenge in the opened Chrome window, then press Enter here to continue...");
    // keep the browser window open and wait for Enter
    await new Promise((resolve) => process.stdin.once("data", resolve));
    // re-check
    await page.waitForTimeout(2000);
    title = await page.title();
    console.log("🔁 After solve, page title:", title);
  }

  // small wait to let JS hydrate
  await sleep(2000);

  // Collect listing entries
  console.log("🔎 Collecting listing entries from the page...");
  let entries;
  try {
    entries = await collectListingEntries(page);
  } catch (e) {
    console.error("❌ collectListingEntries failed:", e.message);
    await browser.close();
    return;
  }

  if (!Array.isArray(entries) || entries.length === 0) {
    console.warn("⚠️ No entries found on listing page. Check selector or if Cloudflare still blocking.");
    // print page snippet for debug
    const snippet = await page.evaluate(() => document.body.innerText.slice(0, 600));
    console.log("---- Page text snippet ----\n", snippet, "\n---- end snippet ----");
    await browser.close();
    return;
  }

  console.log(`✅ Found ${entries.length} entries. Limiting to ${MAX_URLS}.`);
  const toProcess = entries.slice(0, MAX_URLS).map((e) => e.url);

  console.log("➡️ URLs to process:");
  toProcess.forEach((u, i) => console.log(`${i + 1}. ${u}`));

  // Process each URL using enrichOne(browser, url)
  for (let i = 0; i < toProcess.length; i++) {
    const url = toProcess[i];
    console.log(`\n--- (${i + 1}/${toProcess.length}) Processing: ${url}`);
    try {
      const res = await enrichOne(browser, url);
      await appendResult({ url, time: new Date().toISOString(), result: res });
      console.log(`✅ Saved result for ${url}`);
    } catch (e) {
      console.error(`❌ Error enriching ${url}:`, e.message || e);
      await appendResult({ url, time: new Date().toISOString(), error: String(e) });
    }

    // polite delay between jobs
    const wait = BETWEEN_ENRICH_MS + Math.floor(Math.random() * PER_PAGE_DELAY_MS);
    console.log(`⏳ Waiting ${Math.round(wait / 1000)}s before next URL...`);
    await sleep(wait);
  }

  console.log("\n🎉 All done. Closing browser.");
  await browser.close();

  const results = await readResults();
  console.log(`📦 Results saved to ${OUTPUT_FILE} (${results.length} items)`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
