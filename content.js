(() => {
  const PANEL_ID = "cab-panel";
  const STYLE_ID = "cab-style";

  const css = `
    #${PANEL_ID}{position:fixed;top:16px;left:16px;width:520px;height:60vh;z-index:2147483647;background:#fff;color:#111;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.12);display:flex;flex-direction:column;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial}
    #${PANEL_ID} .cab-head{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid #f3f4f6;background:#fafafa;user-select:none}
    #${PANEL_ID} .cab-title{font-weight:700;font-size:14px;letter-spacing:.2px}
    #${PANEL_ID} .cab-actions{margin-left:auto;display:flex;gap:8px}
    #${PANEL_ID} button{all:unset;cursor:pointer;padding:6px 10px;background:#111827;color:#fff;border-radius:8px;font-size:12px;line-height:1}
    #${PANEL_ID} button.secondary{background:#e5e7eb;color:#111827}
    #${PANEL_ID} .cab-body{flex:1;overflow:auto;padding:10px 12px;background:#fff;color:#111;font-size:12px;line-height:1.5;white-space:pre-wrap}
    #${PANEL_ID} .cab-footer{border-top:1px solid #f3f4f6;padding:8px 12px;display:flex;gap:10px;align-items:center;background:#fafafa;font-size:12px;color:#374151}
    #${PANEL_ID} .cab-meta{margin-left:auto;opacity:.8}
    #${PANEL_ID} .cab-resize{position:absolute;right:6px;bottom:6px;width:14px;height:14px;cursor:nwse-resize;border-right:2px solid #cbd5e1;border-bottom:2px solid #cbd5e1;opacity:.7}
  `;
  function ensureStyle(){
    if(!document.getElementById(STYLE_ID)){
      const s=document.createElement("style");
      s.id=STYLE_ID; s.textContent=css;
      document.documentElement.appendChild(s);
    }
  }

  // Boot log
  console.log("%c[C&B Extension] Content script loaded ✅","color: green; font-weight: bold;");

  function createPanel(){
    ensureStyle();
    let panel=document.getElementById(PANEL_ID); if(panel) return panel;
    panel=document.createElement("div");
    panel.id=PANEL_ID;
    panel.innerHTML=`
      <div class="cab-head">
        <div class="cab-title">C&B URL Collector + Details</div>
        <div class="cab-actions">
          <button class="cab-refresh">Rescan</button>
          <button class="cab-enrich secondary" title="Parse details for ALL URLs">Enrich All</button>
          <button class="cab-close secondary">Close</button>
        </div>
      </div>
      <div class="cab-body"></div>
      <div class="cab-footer">
        <span>Shows all listing URLs on this page. “Enrich All” fetches details for every URL.</span>
        <span class="cab-meta"></span>
      </div>
      <div class="cab-resize" title="Drag to resize"></div>`;
    document.documentElement.appendChild(panel);
    panel.querySelector(".cab-close").onclick=()=>panel.remove();
    panel.querySelector(".cab-refresh").onclick=()=>renderUrls();
    panel.querySelector(".cab-enrich").onclick=()=>enrichAll();

    // resize
    const handle=panel.querySelector(".cab-resize");
    let resizing=false,startX=0,startY=0,startW=0,startH=0;
    handle.addEventListener("mousedown",(e)=>{
      e.preventDefault();resizing=true;startX=e.clientX;startY=e.clientY;
      const r=panel.getBoundingClientRect();startW=r.width;startH=r.height;
      document.addEventListener("mousemove",onMove);document.addEventListener("mouseup",onUp);
    });
    function onMove(e){ if(!resizing) return; const dx=e.clientX-startX, dy=e.clientY-startY;
      panel.style.width=Math.max(360,startW+dx)+"px"; panel.style.height=Math.max(260,startH+dy)+"px";}
    function onUp(){resizing=false;document.removeEventListener("mousemove",onMove);document.removeEventListener("mouseup",onUp);}
    return panel;
  }
  const bodyEl=()=>document.getElementById(PANEL_ID)?.querySelector(".cab-body");
  const metaEl=()=>document.getElementById(PANEL_ID)?.querySelector(".cab-meta");

  // URL collection
  const uniq=arr=>Array.from(new Set(arr));
  function collectListingUrls(){
    const anchors=Array.from(document.querySelectorAll('a[href*="/auctions/"]'));
    const urls=anchors
      .map(a=>a.href)
      .filter(h=>/^https?:\/\/(?:www\.)?carsandbids\.com\/auctions\/[^/]+\/[^/]+$/i.test(h));
    return uniq(urls).sort();
  }
  function renderUrls(){
    createPanel();
    const urls=collectListingUrls();
    metaEl().textContent=`${urls.length} urls`;
    bodyEl().textContent=urls.map(u=>JSON.stringify({url:u},null,2)).join("\n\n") || "No URLs found on this page.";
  }

  // Normalization / mapping
  const LABEL_MAP={
    "make":"make","model":"model","mileage":"mileage","vin":"vin","title status":"titleStatus",
    "location":"location","seller":"seller","engine":"engine","drivetrain":"drivetrain",
    "transmission":"transmission","body style":"bodyStyle","exterior color":"exteriorColor",
    "interior color":"interiorColor","seller type":"sellerType"
  };
  const norm=s=>(s||"").replace(/\s+/g," ").replace(/\s*,\s*/g,", ").trim();
  const sleep = (ms)=>new Promise(r=>setTimeout(r,ms));

  function normalizeFields(obj){
    const out = { ...obj };
    if (out.mileage) out.mileage = out.mileage.replace(/(\d),\s+(\d{3})/g, "$1,$2");
    return out;
  }

  // Fetch (server HTML only; no JS)
  async function fetchDoc(url, timeoutMs=12000){
    const ctrl=new AbortController(); const t=setTimeout(()=>ctrl.abort(), timeoutMs);
    try{
      const res=await fetch(url,{credentials:"include",signal:ctrl.signal,mode:"cors"});
      const html=await res.text();
      return new DOMParser().parseFromString(html,"text/html");
    } finally { clearTimeout(t); }
  }

  // Rendered doc via iframe (lets their React hydrate)
  async function loadInIframe(url, timeoutMs=25000){
    console.log("[C&B] iframe load →", url);
    return new Promise((resolve,reject)=>{
      const frame=document.createElement("iframe");
      frame.style.position="fixed";
      frame.style.left="-99999px";
      frame.style.top="-99999px";
      frame.style.width="1200px";
      frame.style.height="2200px";
      // We need both so their JS can run and we can read the DOM
      frame.setAttribute("sandbox","allow-same-origin allow-scripts allow-forms");
      frame.src=url;

      const kill = (err)=>{ try{frame.remove();}catch{} reject(err); };
      const timer=setTimeout(()=>kill(new Error("iframe timeout")), timeoutMs);

      frame.onload=()=>{
        try{
          const win = frame.contentWindow;
          const doc = frame.contentDocument;
          if(!doc) return kill(new Error("no iframe document"));

          const awaitQuickFacts = () => new Promise((res) => {
            let resolved = false;
            const tryResolve = () => {
              const qf = doc.querySelector(".quick-facts");
              const count = qf ? qf.querySelectorAll("dl dt, dl dd").length : 0;
              if (count >= 16 && !resolved) { resolved = true; res(true); }
            };
            // Observe hydration
            const mo = new MutationObserver(() => tryResolve());
            mo.observe(doc.documentElement, { childList: true, subtree: true });

            // Nudge lazy loaders by scrolling
            try { win.scrollTo(0, doc.body.scrollHeight); setTimeout(()=>win.scrollTo(0,0), 200); } catch {}

            // Poll too
            let polls = 0;
            const poll = () => {
              tryResolve();
              if (!resolved && polls++ < 90) setTimeout(poll, 200);
              else if (!resolved) { mo.disconnect(); res(false); }
            };
            poll();

            const stop = () => { if (resolved) mo.disconnect(); else setTimeout(stop, 120); };
            stop();
          });

          awaitQuickFacts().then(()=>{
            clearTimeout(timer);
            const outDoc = frame.contentDocument;
            try{ frame.remove(); }catch{}
            resolve(outDoc);
          });
        } catch (err){
          clearTimeout(timer);
          kill(err);
        }
      };

      document.body.appendChild(frame);
    });
  }

  function extractTitle(doc){
    const h1=doc.querySelector("h1"); if(h1) return norm(h1.textContent);
    const og=doc.querySelector('meta[property="og:title"]')?.getAttribute("content");
    return norm(og||"");
  }

  function cleanDD(dd){
    if(!dd) return "";
    const n = dd.cloneNode(true);
    n.querySelectorAll('button, .subscribe, .subscribeable, .rb, svg, use').forEach(el => el.remove());
    const a = n.querySelector('a');
    const raw = a ? a.textContent : n.textContent;
    return norm(raw).replace(/\b(subscribe|save)\b/ig,"").replace(/\s{2,}/g," ").trim();
  }

  function extractSpecMap(doc){
    const map={};

    const qf = doc.querySelector('.quick-facts');
    if(qf){
      qf.querySelectorAll('dl').forEach(dl=>{
        dl.querySelectorAll('dt').forEach(dt=>{
          const key = norm(dt.textContent).toLowerCase();
          const dd  = dt.nextElementSibling;
          const val = cleanDD(dd);
          if(key && val) map[key]=val;
        });
      });
      // console.log("[C&B] quick-facts keys:", Object.keys(map));
    } else {
      // console.log("[C&B] .quick-facts not found");
    }

    if(Object.keys(map).length===0){
      doc.querySelectorAll("tr").forEach(tr=>{
        const cells=tr.querySelectorAll("th,td");
        if(cells.length>=2){
          const k=norm(cells[0].textContent).toLowerCase();
          const v=norm(cells[1].textContent);
          if(k && v && Object.keys(LABEL_MAP).some(lbl=>k.includes(lbl))) map[k]=v;
        }
      });
    }

    return map;
  }

  function pickFields(raw){
    const picked={};
    for(const [rawK,v] of Object.entries(raw)){
      const k=rawK.toLowerCase();
      const matchKey=Object.keys(LABEL_MAP).find(lbl=>k.includes(lbl));
      if(matchKey) picked[LABEL_MAP[matchKey]]=v;
    }
    return picked;
  }

  async function enrichOne(url){
    // 1) server HTML first
    try{
      const doc=await fetchDoc(url);
      const title=extractTitle(doc);
      const raw=extractSpecMap(doc);
      const fields=normalizeFields(pickFields(raw));
      if(Object.keys(fields).length>0){
        return { url, enriched:true, title: title || undefined, fieldsFound:Object.keys(fields).length, ...fields };
      }
    }catch(e){
      console.warn("[C&B] fetchDoc error:", e);
    }

    // 2) fallback to fully rendered iframe
    try{
      const doc2 = await loadInIframe(url);
      const title2=extractTitle(doc2);
      const raw2=extractSpecMap(doc2);
      const fields2=normalizeFields(pickFields(raw2));
      return { url, enriched:true, title: title2 || undefined, fieldsFound:Object.keys(fields2).length, ...fields2 };
    }catch(e){
      console.error("[C&B] iframe fallback failed:", e);
      return { url, enriched:false, error:String(e) };
    }
  }

  async function enrichAll(){
    const all=collectListingUrls();
    if(!all.length) return;
    metaEl().textContent=`${all.length} urls • fetching…`;

    // show progress placeholders
    bodyEl().textContent = all.map(u => JSON.stringify({url:u, fetching:true}, null, 2)).join("\n\n");

    // cautious concurrency to avoid hammering
    const MAX_CONC = 2;          // safe value
    const GAP_MS   = 200;        // small gap between dispatches
    const queue = all.slice();
    const results=[];
    let active=0, done=0, enrichedCount=0;

    const byUrl = new Map(); // for incremental UI updates

    await new Promise(resolve=>{
      const pump=async ()=>{
        while(active<MAX_CONC && queue.length){
          const url=queue.shift(); active++;
          // small rate limit gap
          await sleep(GAP_MS);

          enrichOne(url)
            .then(o=>{
              results.push(o);
              byUrl.set(url, o);
              done++;
              if (o.enriched && o.fieldsFound>0) enrichedCount++;
              // incremental UI refresh every few items
              if (done % 3 === 0 || done === all.length) {
                const blocks = all.map(u => {
                  const obj = byUrl.get(u);
                  return obj ? JSON.stringify(obj,null,2) : JSON.stringify({url:u, fetching:true},null,2);
                });
                bodyEl().textContent = blocks.join("\n\n");
                metaEl().textContent = `${all.length} urls • ${enrichedCount} enriched • ${done}/${all.length}`;
              }
            })
            .catch(e=>{
              const o = { url, enriched:false, error:String(e) };
              results.push(o);
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

    // final render
    const blocks=all.map(u=>{
      const obj=byUrl.get(u);
      return obj ? JSON.stringify(obj,null,2) : JSON.stringify({url:u},null,2);
    });
    bodyEl().textContent=blocks.join("\n\n");
    metaEl().textContent=`${all.length} urls • ${results.filter(r=>r.enriched && r.fieldsFound>0).length} enriched`;
  }

  // init
  renderUrls();
})();
