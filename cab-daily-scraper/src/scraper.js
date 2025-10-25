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
const TODAY = new Date().toISOString().slice(0, 10); // e.g. "2025-10-18"
const OUTPUT_JSON = path.join(OUTPUT_DIR, `${TODAY}.json`);
const OUTPUT_CSV = path.join(OUTPUT_DIR, `${TODAY}.csv`);
const MAX_URLS = 50;
const PAGE_DELAY_MS = 2000;
const BETWEEN_ENRICH_MS = 3000 + Math.floor(Math.random() * 2000);

async function ensureOutput() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true }).catch(() => { });
  try {
    await fs.access(OUTPUT_JSON);
  } catch {
    await fs.writeFile(OUTPUT_JSON, JSON.stringify([], null, 2));
  }
}

async function readResults() {
  try {
    const txt = await fs.readFile(OUTPUT_JSON, "utf8");
    return JSON.parse(txt || "[]");
  } catch {
    return [];
  }
}

async function appendResult(result) {
  const arr = await readResults();
  arr.push(result);
  await fs.writeFile(OUTPUT_JSON, JSON.stringify(arr, null, 2));
}

async function exportCsv(jsonArr) {
  if (!jsonArr.length) return;
  const headers = Object.keys(jsonArr[0].result || {});
  const csvLines = [
    ["url", "time", ...headers].join(","),
    ...jsonArr.map(
      (r) =>
        [
          r.url,
          r.time,
          ...headers.map((h) => JSON.stringify(r.result[h] || "")),
        ].join(",")
    ),
  ];
  await fs.writeFile(OUTPUT_CSV, csvLines.join("\n"));
}

async function handleCloudflare(page) {
  const title = await page.title();
  if (title.includes("Just a moment") || title.includes("Verify")) {
    console.log("⚠️ Cloudflare challenge detected — waiting...");
    await sleep(10000);
    const newTitle = await page.title();
    if (newTitle.includes("Verify") || newTitle.includes("moment")) {
      console.log("❌ Still blocked, saving screenshot...");
      await page.screenshot({ path: path.join(OUTPUT_DIR, `${TODAY}-blocked.png`) });
      return false;
    }
  }
  return true;
}

async function main() {
  console.log(`[C&B Scraper] 🚀 Starting headless run (${TODAY})`);
  await ensureOutput();

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--disable-infobars",
      "--window-size=1366,768",
    ],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
  );
  await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });

  console.log("🌐 Navigating to listing page...");
  await page.goto("https://carsandbids.com/past-auctions/", {
    waitUntil: "networkidle2",
    timeout: 90000,
  });

  const cfOk = await handleCloudflare(page);
  if (!cfOk) {
    console.error("❌ Cloudflare block not bypassed. Exiting.");
    await browser.close();
    return;
  }

  await sleep(PAGE_DELAY_MS);
  console.log("🔍 Extracting auction links...");
  const entries = await collectListingEntries(page);

  if (!entries.length) {
    console.warn("⚠️ No auctions found. Maybe markup changed or still blocked.");
    await browser.close();
    return;
  }

  console.log(`✅ Found ${entries.length} entries (processing up to ${MAX_URLS}).`);
  const toProcess = entries.slice(0, MAX_URLS).map((e) => e.url);

  const results = [];

  for (let i = 0; i < toProcess.length; i++) {
    const url = toProcess[i];
    console.log(`\n--- (${i + 1}/${toProcess.length}) Processing ${url}`);
    try {
      const res = await enrichOne(browser, url);
      const item = { url, time: new Date().toISOString(), result: res };
      await appendResult(item);
      results.push(item);
      console.log("✅ Saved result");
    } catch (err) {
      console.error(`❌ Error on ${url}:`, err.message || err);
      await appendResult({ url, time: new Date().toISOString(), error: String(err) });
    }
    const wait = BETWEEN_ENRICH_MS + Math.random() * PAGE_DELAY_MS;
    console.log(`⏳ Waiting ${Math.round(wait / 1000)}s...`);
    await sleep(wait);
  }

  if (results.length) {
    console.log("🧾 Exporting CSV...");
    await exportCsv(await readResults());
  }

  console.log(`🎉 Done! Output saved under /output/${TODAY}.json & .csv`);
  await browser.close();
}

main().catch((err) => {
  console.error("💥 Fatal error:", err);
  process.exit(1);
});
