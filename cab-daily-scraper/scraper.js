import puppeteer from "puppeteer";
import axios from "axios";
import { collectListingEntries } from "./url-collector.js";
import { enrichOne } from "./detail-extractor.js";
import { sleep } from "./utils.js";

async function autoScroll(page, maxScrolls = 15) {
  console.log("🔽 Starting auto-scroll...");
  for (let i = 0; i < maxScrolls; i++) {
    await page.evaluate(() => {
      window.scrollBy(0, window.innerHeight);
    });
    await sleep(1500);
    console.log(`  ➡️ Scroll ${i + 1}/${maxScrolls}`);
  }
  console.log("✅ Finished auto-scroll");
}

async function main() {
  console.log("[C&B Scraper] Starting automated job ✅");

  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
    ],
    defaultViewport: { width: 1366, height: 768 },
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119 Safari/537.36"
  );

  // Step 1: Navigate
  console.log("Navigating to past auctions page…");
  await page.goto("https://carsandbids.com/past-auctions/", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  // Debug output
  await page.screenshot({ path: "debug.png", fullPage: true });
  const html = await page.content();
  console.log("----- PAGE HTML SNIPPET -----");
  console.log(html.slice(0, 1000));

  // Step 2: Wait for auction cards
  try {
    await page.waitForSelector("a[href*='/auctions/']", { timeout: 20000 });
    console.log("✅ Auction anchors detected");
  } catch {
    console.warn("⚠️ Could not find auction anchors after load!");
  }

  // Step 3: Scroll
  await autoScroll(page, 10);

  // Step 4: Collect
  const entries = await collectListingEntries(page);
  console.log(`📊 Found ${entries.length} auction entries`);

  let successCount = 0;
  let failCount = 0;

  // Step 5: Enrich + Save
  for (const [i, entry] of entries.entries()) {
    console.log(`Processing ${i + 1}/${entries.length}: ${entry.url}`);

    const result = await enrichOne(browser, entry.url);
    if (entry.ended) result.ended = entry.ended;

    try {
      await axios.post("https://backend.carsandbids-labs.workers.dev/auctions", result);
      console.log(`✅ Saved: ${result.url}`);
      successCount++;
    } catch (err) {
      console.error(`❌ Error saving ${result.url}:`, err.message);
      failCount++;
    }

    await sleep(300);
  }

  await browser.close();

  console.log("----- Scrape Summary -----");
  console.log(`Total entries:       ${entries.length}`);
  console.log(`Successfully saved:  ${successCount}`);
  console.log(`Failed to save:      ${failCount}`);
  console.log("[C&B Scraper] Done ✅");
}

main().catch((err) => {
  console.error("Fatal error in scraper:", err);
  process.exit(1);
});
