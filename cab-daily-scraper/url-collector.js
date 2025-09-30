export async function collectListingEntries(page) {
  return await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a[href*="/auctions/"]'));
    const seen = new Set();
    const entries = [];

    for (const a of anchors) {
      const href = a.href;
      if (!/^https?:\/\/(?:www\.)?carsandbids\.com\/auctions\//i.test(href)) continue;
      if (seen.has(href)) continue;
      seen.add(href);

      const container =
        a.closest('article, li, .listing, .auction-card, .grid-item, .result, .results, .card') ||
        a.closest('div');

      let ended = "";
      if (container && container.textContent) {
        const m = container.textContent.match(/Ended\s+[^\n]+/i);
        if (m) ended = m[0].trim();
      }

      entries.push({ url: href, ended });
    }
    return entries;
  });
}
