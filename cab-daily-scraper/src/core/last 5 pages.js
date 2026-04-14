import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { collectListingEntries } from "./url-collector.js";
import { enrichOne } from "./detail-extractor.js";
import { sleep } from "./utils.js"; // ✅ FIX

puppeteer.use(StealthPlugin());

// ---------- Main scraper ----------
async function main() {
  console.log(`[C&B Scraper] 🚀 Debug mode (last 5 auctions)`);

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128 Safari/537.36"
  );

  console.log("🌐 Loading first page...");
  await page.goto("https://carsandbids.com/past-auctions/", {
    waitUntil: "networkidle2",
  });

  await sleep(2000); // now works

  const entries = await collectListingEntries(page);

  if (!entries.length) {
    console.log("❌ No entries found");
    await browser.close();
    return;
  }

  // 🔥 LAST 5 AUCTIONS
  const toProcess = entries.slice(0, 5).map(e => e.url);

  console.log(`🚗 Testing ${toProcess.length} auctions`);

  for (let i = 0; i < toProcess.length; i++) {
    const url = toProcess[i];
    console.log(`\n--- (${i + 1}/5) ${url}`);

    try {
      const res = await enrichOne(browser, url);
      console.log("✅ RESULT:", JSON.stringify(res, null, 2));
    } catch (err) {
      console.error("❌ FAILED:", err.message);
    }
  }

  await browser.close();
}

main();