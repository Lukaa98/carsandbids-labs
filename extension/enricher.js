(() => {
  const Util = window.CAB_Util;
  const PanelUI = window.CAB_PanelUI;
  const UrlCollector = window.CAB_UrlCollector;
  const DetailExtractor = window.CAB_DetailExtractor;

  class Enricher {
    constructor(panel){
      this.panel = panel;
    }

    renderUrls(){
      this.panel.mount();
      const entries = UrlCollector.collectListingEntries();
      this.panel.setMeta(`${entries.length} urls (page order)`);
      const blocks = entries.length
        ? entries.map(e => JSON.stringify(e, null, 2))
        : ["No URLs found on this page."];
      this.panel.setBodyBlocks(blocks);
    }

    async enrichAll(opts = { preserveOrder:false, includeEnded:false }){
      const entries = UrlCollector.collectListingEntries();
      if(!entries.length) return;

      const urls = opts.preserveOrder ? entries.map(e=>e.url) : Array.from(new Set(entries.map(e=>e.url)));
      this.panel.setMeta(`${urls.length} urls • fetching…`);

      const placeholders = urls.map((u, i) => {
        const ended = opts.includeEnded ? entries[i]?.ended : undefined;
        const base = ended ? { url:u, ended, fetching:true } : { url:u, fetching:true };
        return JSON.stringify(base, null, 2);
      });
      this.panel.setBodyBlocks(placeholders);

      const MAX_CONC = 2;
      const GAP_MS   = 200;
      const queue = urls.slice();
      const byUrl = new Map();
      let active=0, done=0, enrichedCount=0;

      await new Promise(resolve=>{
        const pump=async ()=>{
          while(active<MAX_CONC && queue.length){
            const url=queue.shift(); active++;
            await Util.sleep(GAP_MS);
            DetailExtractor.enrichOne(url)
              .then(o=>{
                if (opts.includeEnded){
                  const idx = urls.indexOf(url);
                  const endedVal = entries[idx]?.ended;
                  if (endedVal && o && typeof o === "object") o.ended = endedVal;
                }
                byUrl.set(url, o);
                done++;
                if (o.enriched && o.fieldsFound>0) enrichedCount++;
                if (done % 3 === 0 || done === urls.length) {
                  const blocks = urls.map((u, i) => {
                    const obj = byUrl.get(u);
                    if (obj) return JSON.stringify(obj, null, 2);
                    const ended = opts.includeEnded ? entries[i]?.ended : undefined;
                    const base = ended ? { url:u, ended, fetching:true } : { url:u, fetching:true };
                    return JSON.stringify(base, null, 2);
                  });
                  this.panel.setBodyBlocks(blocks);
                  this.panel.setMeta(`${urls.length} urls • ${enrichedCount} enriched • ${done}/${urls.length}`);
                }
              })
              .catch(e=>{
                const o = { url, enriched:false, error:String(e) };
                if (opts.includeEnded){
                  const idx = urls.indexOf(url);
                  const endedVal = entries[idx]?.ended;
                  if (endedVal) o.ended = endedVal;
                }
                byUrl.set(url, o);
                done++;
              })
              .finally(()=>{
                active--;
                if(queue.length) pump();
                else if(active===0) resolve();
              });
          }
        };
        pump();
      });

      const finalBlocks = urls.map((u)=> JSON.stringify(byUrl.get(u) || { url:u }, null, 2));
      this.panel.setBodyBlocks(finalBlocks);
      const ok = Array.from(byUrl.values()).filter(r=>r?.enriched && r?.fieldsFound>0).length;
      this.panel.setMeta(`${urls.length} urls • ${ok} enriched`);
    }
  }

  window.CAB_Enricher = Enricher;
})();
