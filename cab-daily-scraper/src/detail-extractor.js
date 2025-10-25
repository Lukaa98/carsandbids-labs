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

    const title = await page.title();
    console.log(`🧭 Page title: "${title}"`);

    // Scroll to trigger lazy hydration
    await page.evaluate(() => window.scrollBy(0, 1000));
    await new Promise((r) => setTimeout(r, 2000));

    // Wait for the quick-facts section
    console.log(`⏳ Waiting for .quick-facts container...`);
    const containerFound = await waitForSelectorSafe(page, ".quick-facts", 60000);
    console.log(containerFound ? `✅ Found .quick-facts container` : `❌ .quick-facts never appeared`);

    if (!containerFound) {
      const snippet = await page.evaluate(() => document.body.innerText.slice(0, 400));
      console.log("🧩 Body snippet preview:\n", snippet);
      throw new Error("quick-facts not rendered yet (React still hydrating?)");
    }

    // Wait for data to populate
    console.log(`⏳ Waiting for data inside .quick-facts...`);
    const dataReady = await waitForQuickFacts(page);
    if (dataReady) console.log(`✅ .quick-facts fully populated`);
    else console.warn(`⚠️ quick-facts element found but seems empty`);

    // --- Evaluate data inside browser context ---
    const rawData = await page.evaluate(() => {
      const norm = (s) => (s || "").replace(/\s+/g, " ").trim();

      const title = norm(
        document.querySelector("h1")?.textContent ||
        document.querySelector('meta[property="og:title"]')?.content ||
        ""
      );

      // QUICK FACTS
      const specMap = {};
      const qf = document.querySelector(".quick-facts");
      if (qf) {
        qf.querySelectorAll("dl").forEach((dl) => {
          dl.querySelectorAll("dt").forEach((dt) => {
            const key = norm(dt.textContent).toLowerCase();
            const dd = dt.nextElementSibling;
            const val = norm(dd?.textContent || "");
            if (key && val) specMap[key] = val;
          });
        });
      }

      // STATUS (handles Sold vs Bid to)
      const text = document.body.innerText;
      const soldMatch = text.match(/Sold\s+(?:for\s+)?\$([\d,]+)/i);
      const bidToMatch = text.match(/Bid\s*to\s*\$([\d,]+)/i);
      const bidCountMatch = text.match(/\bBids?\b\s*(\d+)/i);
      const commentMatch = text.match(/\bComments?\b\s*(\d+)/i);
      const viewMatch = text.match(/\bViews?\b\s*([\d,]+)/i);
      const watchMatch = text.match(/\bWatching\b\s*([\d,]+)/i);
      const endMatch = text.match(/Ended\s+(.*?)\n/i);

      let saleType = "Bid to";
      let finalSalePrice = null;
      let finalBidPrice = null;

      if (soldMatch) {
        saleType = "Sold";
        finalSalePrice = Number(soldMatch[1].replace(/,/g, ""));
        finalBidPrice = finalSalePrice;
      } else if (bidToMatch) {
        saleType = "Bid to";
        finalBidPrice = Number(bidToMatch[1].replace(/,/g, ""));
      }

      const status = {
        saleType,
        finalSalePrice,
        finalBidPrice,
        currency: "USD",
        endDate: endMatch ? norm(endMatch[1]) : null,
        numBids: bidCountMatch ? Number(bidCountMatch[1]) : null,
        numComments: commentMatch ? Number(commentMatch[1]) : null,
        numViews: viewMatch ? Number(viewMatch[1].replace(/,/g, "")) : null,
        numWatchers: watchMatch ? Number(watchMatch[1].replace(/,/g, "")) : null,
      };

      // MEDIA — robust extraction
      function pickBestFromSrcset(srcset) {
        if (!srcset) return null;
        const parts = srcset.split(",").map((p) => p.trim()).filter(Boolean);
        if (!parts.length) return null;
        return parts[parts.length - 1].split(/\s+/)[0];
      }

      function absUrl(u) {
        try {
          return new URL(u, location.origin).toString();
        } catch {
          return null;
        }
      }

      const found = new Set();
      const imageUrls = [];

      // Collect images
      const gallerySelectors = [
        ".photo-gallery img",
        ".listing-media img",
        ".gallery img",
        "img",
      ];

      for (const sel of gallerySelectors) {
        document.querySelectorAll(sel).forEach((img) => {
          let url =
            img.getAttribute("data-src") ||
            img.getAttribute("data-original") ||
            img.getAttribute("data-lazy") ||
            img.getAttribute("src") ||
            null;
          if (!url && img.getAttribute("srcset"))
            url = pickBestFromSrcset(img.getAttribute("srcset"));
          if (!url && img.getAttribute("data-srcset"))
            url = pickBestFromSrcset(img.getAttribute("data-srcset"));
          if (url && !/cookieyes|icon|svg/i.test(url)) {
            url = absUrl(url);
            if (url && !found.has(url)) {
              found.add(url);
              imageUrls.push(url);
            }
          }
        });
        if (imageUrls.length) break;
      }

      // fallback: og:image
      if (!imageUrls.length) {
        const og = document.querySelector('meta[property="og:image"]')?.content;
        if (og) {
          const url = absUrl(og);
          if (url && !found.has(url)) {
            found.add(url);
            imageUrls.push(url);
          }
        }
      }


      // Step 0: Directly check for the full-size main photo
      let mainImageUrl = null;
      const mainImgEl = document.querySelector(".preload-wrap.main.loaded img");
      if (mainImgEl) {
        const src = mainImgEl.getAttribute("src") || mainImgEl.getAttribute("data-src");
        if (src && /media\.carsandbids\.com/i.test(src)) {
          mainImageUrl = src;
        }
      }

      const imageCount = imageUrls.length;

      // HIGHLIGHTS
      const hNodes = Array.from(
        document.querySelectorAll(".highlights li, .Highlights li, .key-features li")
      );
      const highlights = Array.from(
        new Set(hNodes.map((li) => norm(li.textContent)).filter(Boolean))
      );

      return {
        title,
        specMap,
        status,
        media: { mainImageUrl, imageCount, hasVideo: !!document.querySelector("video") },
        highlights,
      };
    });

    // --- Normalize quick-facts data ---
    const fields = normalizeFields(pickFields(rawData.specMap));

    // --- Add year from title if missing ---
    if (!fields.year) {
      const match = rawData.title?.match(/\b(19|20)\d{2}\b/);
      if (match) fields.year = match[0];
    }

    // --- Build structured result ---
    const result = {
      auctionId: url.split("/auctions/")[1]?.split("/")[0] || null,
      url,
      title: rawData.title || null,
      status: rawData.status,
      vehicle: {
        year: fields.year ? Number(fields.year) : null,
        make: fields.make || null,
        model: fields.model || null,
        trim: fields.trim || null,
        body: {
          style: fields.bodyStyle || null,
          segment: null,
          doors: null,
          colorExterior: fields.exteriorColor || null,
          colorInterior: fields.interiorColor || null,
        },
        specs: {
          engine: fields.engine || null,
          horsepower: null,
          torque: null,
          drivetrain: fields.drivetrain || null,
          transmission: fields.transmission || null,
          fuelType: null,
          performance: { zeroToSixty: null, topSpeedMph: null },
        },
        mileage: {
          value: fields.mileage
            ? Number(fields.mileage.replace(/[^0-9]/g, ""))
            : null,
          unit: fields.mileage?.includes("km") ? "km" : "miles",
        },
        vin: fields.vin || null,
        titleStatus: fields.titleStatus || null,
      },
      seller: {
        type: fields.sellerType || fields.seller || null,
        location: fields.location || null,
      },
      highlights: rawData.highlights || [],
      media: {
        mainImageUrl: rawData.media.mainImageUrl || null,
        imageCount: rawData.media.imageCount || 0,
        hasVideo: !!rawData.media.hasVideo,
      },
      metadata: {
        scrapedAt: new Date().toISOString(),
        source: "CarsAndBids",
        dataVersion: 2,
      },
    };

    // --- Derive vehicle segment ---
    const style = (result.vehicle.body.style || "").toLowerCase();
    const mileageVal = result.vehicle.mileage.value || 0;
    const make = (result.vehicle.make || "").toLowerCase();

    if (style.includes("suv")) {
      result.vehicle.body.segment = mileageVal > 100000 ? "Used SUV" : "Luxury SUV";
    } else if (style.includes("convertible")) {
      result.vehicle.body.segment = "Sports Convertible";
    } else if (["ferrari", "porsche", "lamborghini"].includes(make)) {
      result.vehicle.body.segment = "Exotic Sports";
    } else {
      result.vehicle.body.segment = "Standard Vehicle";
    }

    console.log(`✅ Extracted structured data for: ${url}`);
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
