// scraper.js
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs/promises";
import path from "path";
import { collectListingEntries } from "./url-collector.js";
import { enrichOne } from "./detail-extractor.js";
import { sleep } from "./utils.js";

puppeteer.use(StealthPlugin());

// ✅ Output one directory above /core
const OUTPUT_DIR = path.resolve("../output");
const TODAY = new Date().toISOString().slice(0, 10);
const OUTPUT_JSON = path.join(OUTPUT_DIR, `${TODAY}.json`);
const OUTPUT_CSV = path.join(OUTPUT_DIR, `${TODAY}.csv`);

// ✅ Optional --limit argument for local testing
const argLimit = process.argv.find(arg => arg.startsWith("--limit="));
const MAX_URLS = argLimit ? Number(argLimit.split("=")[1]) : 50;
console.log(`🔢 Scrape limit set to ${MAX_URLS} listings${MAX_URLS < 50 ? " (local test mode)" : ""}`);

const PAGE_DELAY_MS = 2000;
const BETWEEN_ENRICH_MS = 3000 + Math.floor(Math.random() * 2000);
const BACKEND_URL = "https://backend.carsandbids-labs.workers.dev/save";

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

// ✅ Clean "Save" suffix if leaked into title/model
function sanitizeSaveLeak(result) {
  if (result?.title) result.title = result.title.replace(/\s*Save$/, "").trim();
  if (result?.vehicle?.model)
    result.vehicle.model = result.vehicle.model.replace(/\s*Save$/, "").trim();
  if (result?.vehicle?.make)
    result.vehicle.make = result.vehicle.make.replace(/\s*Save$/, "").trim();
  return result;
}

// ✅ Replaces existing auctionId entry if found
async function appendResult(result) {
  const arr = await readResults();
  const newId = result.result?.auctionId;

  if (result.result) {
    // Clean before writing
    result.result = sanitizeSaveLeak(result.result);
  }

  if (!newId) {
    console.warn("⚠️ Missing auctionId for result:", result.url);
    arr.push(result);
  } else {
    const existingIndex = arr.findIndex(r => r.result?.auctionId === newId);
    if (existingIndex >= 0) {
      console.log(`♻️ Updating existing auction: ${newId}`);
      arr[existingIndex] = result; // replace old
    } else {
      arr.push(result);
    }
  }

  await fs.writeFile(OUTPUT_JSON, JSON.stringify(arr, null, 2));
}

async function exportCsv(jsonArr) {
  if (!jsonArr.length) return;
  const headers = Object.keys(jsonArr[0].result || {});
  const csvLines = [
    ["url", "time", ...headers].join(","),
    ...jsonArr.map(
      r =>
        [
          r.url,
          r.time,
          ...headers.map(h => JSON.stringify(r.result[h] || "")),
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

// ✅ Upload results in batches (with clearer logs)
async function uploadResults(results) {
  console.log(`📤 Uploading ${results.length} scraped results to backend...`);

  for (let i = 0; i < results.length; i++) {
    const item = results[i];
    try {
      const clean = sanitizeSaveLeak(item.result);

      const res = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clean),
      });

      const out = await res.json();
      if (out.ok) {
        console.log(`✅ (${i + 1}/${results.length}) [${clean.auctionId}] ${clean.url} → Saved/Updated`);
      } else {
        console.warn(`⚠️ (${i + 1}/${results.length}) [${clean.auctionId}] ${out.error || "Unknown backend error"}`);
      }
    } catch (err) {
      console.error(`❌ (${i + 1}/${results.length}) Upload failed: ${item.result?.url || "?"} → ${err.message}`);
    }

    // small delay to avoid rate limiting
    await sleep(300);
  }

  console.log("🎯 Upload completed.");
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
  const toProcess = entries.slice(0, MAX_URLS).map(e => e.url);

  const results = [];

  for (let i = 0; i < toProcess.length; i++) {
    const url = toProcess[i];
    console.log(`\n--- (${i + 1}/${toProcess.length}) Processing ${url}`);
    try {
      let res = await enrichOne(browser, url);
      res = sanitizeSaveLeak(res);
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
    await uploadResults(results);
  }

  console.log(`🎉 Done! Output saved under /output/${TODAY}.json & .csv`);
  await browser.close();
}

main().catch(err => {
  console.error("💥 Fatal error:", err);
  process.exit(1);
});
