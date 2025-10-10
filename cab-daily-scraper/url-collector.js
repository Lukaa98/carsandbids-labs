export async function collectListingEntries(page) {
  return await page.evaluate(() => {
    const entries = [];
    const seen = new Set();

    const items = document.querySelectorAll(".auctions-list.past-auctions .auction-item");

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
}
