// scraper.js
import puppeteer from "puppeteer";
import axios from "axios";
import { collectListingEntries } from "./url-collector.js";
import { enrichOne } from "./detail-extractor.js";
import { sleep } from "./utils.js";

async function main() {
  console.log("[C&B Scraper] Starting automated job ✅");

  // Launch Puppeteer with no-sandbox flags (needed in GitHub Actions)
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  // Step 1: Go to past auctions page
  console.log("Navigating to past auctions page…");
  await page.goto("https://carsandbids.com/past-auctions/", {
    waitUntil: "networkidle2",
    timeout: 60000,
  });

  // Step 2: Collect listing entries
  const entries = await collectListingEntries(page);
  console.log(`Found ${entries.length} auction entries`);

  // Counters for summary
  let successCount = 0;
  let failCount = 0;

  // Step 3: Enrich details for each URL
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

    await sleep(200); // throttle requests
  }

  await browser.close();

  // Step 4: Summary
  console.log("----- Scrape Summary -----");
  console.log(`Total entries:   ${entries.length}`);
  console.log(`Successfully saved: ${successCount}`);
  console.log(`Failed to save:     ${failCount}`);
  console.log("[C&B Scraper] Done ✅");
}

main().catch((err) => {
  console.error("Fatal error in scraper:", err);
  process.exit(1);
});
