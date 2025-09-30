// detail-extractor.js
import { normalizeFields, pickFields } from "./utils.js";

export async function enrichOne(browser, url) {
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    const rawData = await page.evaluate(() => {
      function norm(s) {
        return (s || "").replace(/\s+/g, " ").trim();
      }

      function extractTitle() {
        const h1 = document.querySelector("h1");
        if (h1) return norm(h1.textContent);
        const og = document.querySelector('meta[property="og:title"]')?.getAttribute("content");
        return norm(og || "");
      }

      function extractSpecMap() {
        const map = {};
        const qf = document.querySelector(".quick-facts");
        if (qf) {
          qf.querySelectorAll("dl").forEach((dl) => {
            dl.querySelectorAll("dt").forEach((dt) => {
              const key = norm(dt.textContent).toLowerCase();
              const dd = dt.nextElementSibling;
              const val = norm(dd?.textContent || "");
              if (key && val) map[key] = val;
            });
          });
        }
        return map;
      }

      return {
        title: extractTitle(),
        raw: extractSpecMap(),
      };
    });

    const fields = normalizeFields(pickFields(rawData.raw));
    return {
      url,
      enriched: true,
      title: rawData.title || undefined,
      fieldsFound: Object.keys(fields).length,
      ...fields,
    };
  } catch (e) {
    return { url, enriched: false, error: String(e) };
  } finally {
    await page.close();
  }
}
