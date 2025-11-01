// url-collector.js
/**
 * Collects all visible auction listing entries from Cars & Bids “Past Auctions”.
 * Waits for infinite scroll to finish, then returns ordered list of { url, ended } objects.
 */
export async function collectListingEntries(page) {
  console.log("⏳ Scrolling through Cars & Bids past auctions...");

  let lastHeight = 0;
  let stableCount = 0;

  // Keep scrolling until no new content appears
  for (let i = 0; i < 20; i++) {
    await page.evaluate(() => window.scrollBy(0, document.body.scrollHeight));
    await new Promise((r) => setTimeout(r, 1500));

    const newHeight = await page.evaluate(() => document.body.scrollHeight);
    if (newHeight === lastHeight) {
      stableCount++;
    } else {
      stableCount = 0;
    }
    lastHeight = newHeight;

    if (stableCount >= 3) {
      console.log("✅ Page fully loaded — no new auctions appearing");
      break;
    }
  }

  // Now evaluate once DOM is fully hydrated and scrolled
  const entries = await page.evaluate(() => {
    const entries = [];
    const seen = new Set();

    const items = document.querySelectorAll(
      ".auctions-list.past-auctions .auction-item"
    );

    for (const item of items) {
      const a = item.querySelector(".auction-title a[href*='/auctions/']");
      if (!a) continue;

      const href = a.href.startsWith("http")
        ? a.href
        : `https://carsandbids.com${a.getAttribute("href")}`;

      if (seen.has(href)) continue;
      seen.add(href);

      // Grab any “Ended” or “Sold for” text
      const txt = item.innerText || "";
      const soldMatch = txt.match(/Sold\s+for\s+\$[\d,]+/i);
      const endedMatch = txt.match(/Ended\s+\S+/i);
      const ended = soldMatch ? soldMatch[0] : endedMatch ? endedMatch[0] : "";

      entries.push({ url: href, ended });
    }

    return entries;
  });

  // Return in DOM order (newest → oldest)
  console.log(`✅ Found ${entries.length} auctions in visible order`);
  return entries;
}
