export async function collectListingEntries(page) {
  return await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll(".auction-card"));
    const entries = [];
    const seen = new Set();

    for (const card of cards) {
      const a = card.querySelector("a[href]");
      if (!a) continue;

      const href = a.href;
      if (!/^https?:\/\/(?:www\.)?carsandbids\.com\/auctions\//i.test(href)) continue;
      if (seen.has(href)) continue;
      seen.add(href);

      let ended = "";
      const txt = card.textContent || "";
      const m = txt.match(/Ended\s+[^\n]+/i);
      if (m) ended = m[0].trim();

      entries.push({ url: href, ended });
    }

    return entries;
  });
}
