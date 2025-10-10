// detail-extractor.js
import { normalizeFields, pickFields } from "./utils.js";

export async function enrichOne(browser, url) {
  const page = await browser.newPage();

  try {
    console.log(`\n============================`);
    console.log(`🔍 Enriching: ${url}`);

    const startTime = Date.now();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    console.log(`⏳ [${elapsed(startTime)}s] DOM content loaded`);

    // Log basic page state
    const title = await page.title();
    console.log(`🧭 Page title: "${title}"`);

    // Start monitoring console & network requests
    page.on("console", (msg) => console.log(`  [browser log] ${msg.text()}`));
    page.on("response", (res) => {
      if (res.url().includes("/graphql")) console.log(`  [network] GraphQL response: ${res.status()} ${res.url()}`);
    });

    // Scroll a bit to trigger lazy hydration
    await page.evaluate(() => window.scrollBy(0, 1000));
    await new Promise((r) => setTimeout(r, 2000));

    // Wait for the .quick-facts container (React hydration)
    console.log(`⏳ Waiting for .quick-facts container...`);
    const containerFound = await waitForSelectorSafe(page, ".quick-facts", 60000);
    console.log(containerFound ? `✅ Found .quick-facts container` : `❌ .quick-facts never appeared`);

    if (!containerFound) {
      // Debug: print the body snippet to see what’s rendered
      const snippet = await page.evaluate(() => document.body.innerText.slice(0, 400));
      console.log("🧩 Body snippet preview:\n", snippet);
      throw new Error("quick-facts not rendered yet (React still hydrating?)");
    }

    // Wait until quick-facts has data
    console.log(`⏳ Waiting for data inside .quick-facts...`);
    const dataReady = await waitForQuickFacts(page);
    if (dataReady) console.log(`✅ .quick-facts fully populated`);
    else console.warn(`⚠️ quick-facts element found but seems empty`);

    // Evaluate inside browser
    const rawData = await page.evaluate(() => {
      function norm(s) {
        return (s || "").replace(/\s+/g, " ").trim();
      }
      const extractTitle = () => {
        const h1 = document.querySelector("h1");
        if (h1) return norm(h1.textContent);
        const og = document.querySelector('meta[property="og:title"]')?.getAttribute("content");
        return norm(og || "");
      };
      const extractSpecMap = () => {
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
      };
      return { title: extractTitle(), raw: extractSpecMap() };
    });

    const fields = normalizeFields(pickFields(rawData.raw));
    const result = {
      url,
      enriched: true,
      title: rawData.title || undefined,
      fieldsFound: Object.keys(fields).length,
      ...fields,
    };

    console.log(`✅ Extracted ${Object.keys(fields).length} fields for: ${url}`);
    console.log(`⏱️ Total time: ${elapsed(startTime)}s`);
    console.log(`============================\n`);
    return result;
  } catch (e) {
    console.error(`❌ Failed to enrich ${url}:`, e.message);
    console.log(`============================\n`);
    return { url, enriched: false, error: String(e) };
  } finally {
    await page.close();
  }
}

/**
 * Helper: Wait for selector safely, returning true/false instead of throwing
 */
async function waitForSelectorSafe(page, selector, timeout = 30000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * Helper: Wait until .quick-facts has ≥5 filled <dd> entries
 */
async function waitForQuickFacts(page) {
  for (let i = 0; i < 20; i++) {
    const ready = await page.evaluate(() => {
      const qf = document.querySelector(".quick-facts");
      if (!qf) return false;
      const dds = Array.from(qf.querySelectorAll("dd")).map((d) => d.textContent.trim());
      return dds.filter(Boolean).length >= 5;
    });
    if (ready) return true;
    await new Promise((r) => setTimeout(r, 1500));
  }
  return false;
}

/**
 * Helper: elapsed time formatter
 */
function elapsed(start) {
  return ((Date.now() - start) / 1000).toFixed(1);
}
