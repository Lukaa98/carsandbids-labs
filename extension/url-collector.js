(() => {
  const Util = window.CAB_Util;

  class UrlCollector {
    static collectListingEntries(){
      const anchors = Array.from(document.querySelectorAll('a[href*="/auctions/"]'));
      const seen = new Set();
      const entries = [];

      for (const a of anchors){
        const href = a.href;
        if (!Util.AUCTION_RX.test(href)) continue;
        if (seen.has(href)) continue;
        seen.add(href);

        const container =
          a.closest('article, li, .listing, .auction-card, .grid-item, .result, .results, .card') ||
          a.closest('div');

        let ended = "";
        if (container && container.textContent){
          const txt = container.textContent;
          const m = txt.match(/Ended\s+[^\n]+/i);
          if (m) ended = Util.norm(m[0]);
        }
        entries.push({ url: href, ended });
      }
      return entries;
    }
  }

  window.CAB_UrlCollector = UrlCollector;
})();
