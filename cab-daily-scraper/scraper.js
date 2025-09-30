// scrape.js
import puppeteer from "puppeteer";
import axios from "axios";
import { collectListingEntries } from "./url-collector.js";
import { enrichOne } from "./detail-extractor.js";
import { sleep } from "./utils.js";

async function main() {
  console.log("[C&B Scraper] Starting automated job ✅");

  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  // Step 1: Go to past auctions page
  await page.goto("https://carsandbids.com/past-auctions/", { waitUntil: "networkidle2" });

  // Step 2: Collect listing entries
  const entries = await collectListingEntries(page);
  console.log(`Found ${entries.length} entries`);

  // Step 3: Enrich details for each URL
  for (const entry of entries) {
    const result = await enrichOne(browser, entry.url);
    if (entry.ended) result.ended = entry.ended;

    try {
      await axios.post("https://backend.carsandbids-labs.workers.dev/auctions", result);
      console.log("Saved:", result.url);
    } catch (err) {
      console.error("Error saving", result.url, err.message);
    }

    await sleep(200); // throttle requests
  }

  await browser.close();
  console.log("[C&B Scraper] Done ✅");
}

main();
