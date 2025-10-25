import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { enrichOne } from "./detail-extractor.js";

puppeteer.use(StealthPlugin());

const TEST_URL = "https://carsandbids.com/auctions/KPmqe4WZ/2015-range-rover-hse"; // example

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const result = await enrichOne(browser, TEST_URL);

  console.log("\n===========================");
  console.log("✅ FINAL RESULT OBJECT:");
  console.log(JSON.stringify(result, null, 2));
  console.log("===========================\n");

  await browser.close();
})();
