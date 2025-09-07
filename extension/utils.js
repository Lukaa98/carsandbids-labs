(() => {
  class Util {
    static PANEL_ID = "cab-panel";
    static STYLE_ID = "cab-style";
    static AUCTION_RX = /^https?:\/\/(?:www\.)?carsandbids\.com\/auctions\/[^/]+\/[^/]+$/i;

    static LABEL_MAP = {
      "make":"make","model":"model","mileage":"mileage","vin":"vin","title status":"titleStatus",
      "location":"location","seller":"seller","engine":"engine","drivetrain":"drivetrain",
      "transmission":"transmission","body style":"bodyStyle","exterior color":"exteriorColor",
      "interior color":"interiorColor","seller type":"sellerType"
    };

    static norm(s){ return (s||"").replace(/\s+/g," ").trim(); }
    static sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

    static normalizeFields(obj){
      const out = { ...obj };
      if (out.mileage) out.mileage = out.mileage.replace(/(\d),\s+(\d{3})/g, "$1,$2");
      return out;
    }

    static ensureStyle(css){
      if(!document.getElementById(this.STYLE_ID)){
        const s=document.createElement("style");
        s.id=this.STYLE_ID; s.textContent=css;
        document.documentElement.appendChild(s);
      }
    }

    static async fetchDoc(url, timeoutMs=12000){
      const ctrl=new AbortController(); const t=setTimeout(()=>ctrl.abort(), timeoutMs);
      try{
        const res=await fetch(url,{credentials:"include",signal:ctrl.signal,mode:"cors"});
        const html=await res.text();
        return new DOMParser().parseFromString(html,"text/html");
      } finally { clearTimeout(t); }
    }

    static async loadInIframe(url, timeoutMs=25000){
      return new Promise((resolve,reject)=>{
        const frame=document.createElement("iframe");
        frame.style.position="fixed";
        frame.style.left="-99999px";
        frame.style.top="-99999px";
        frame.style.width="1200px";
        frame.style.height="2200px";
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
              const mo = new MutationObserver(() => tryResolve());
              mo.observe(doc.documentElement, { childList: true, subtree: true });
              try { win.scrollTo(0, doc.body.scrollHeight); setTimeout(()=>win.scrollTo(0,0), 200); } catch {}
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

    static extractTitle(doc){
      const h1=doc.querySelector("h1"); if(h1) return this.norm(h1.textContent);
      const og=doc.querySelector('meta[property="og:title"]')?.getAttribute("content");
      return this.norm(og||"");
    }

    static cleanDD(dd){
      if(!dd) return "";
      const n = dd.cloneNode(true);
      n.querySelectorAll('button, .subscribe, .subscribeable, .rb, svg, use').forEach(el => el.remove());
      const a = n.querySelector('a');
      const raw = a ? a.textContent : n.textContent;
      return this.norm(raw).replace(/\b(subscribe|save)\b/ig,"").replace(/\s{2,}/g," ").trim();
    }

    static extractSpecMap(doc){
      const map={};
      const qf = doc.querySelector('.quick-facts');
      if(qf){
        qf.querySelectorAll('dl').forEach(dl=>{
          dl.querySelectorAll('dt').forEach(dt=>{
            const key = this.norm(dt.textContent).toLowerCase();
            const dd  = dt.nextElementSibling;
            const val = this.cleanDD(dd);
            if(key && val) map[key]=val;
          });
        });
      }
      if(Object.keys(map).length===0){
        doc.querySelectorAll("tr").forEach(tr=>{
          const cells=tr.querySelectorAll("th,td");
          if(cells.length>=2){
            const k=this.norm(cells[0].textContent).toLowerCase();
            const v=this.norm(cells[1].textContent);
            if(k && v && Object.keys(this.LABEL_MAP).some(lbl=>k.includes(lbl))) map[k]=v;
          }
        });
      }
      return map;
    }

    static pickFields(raw){
      const picked={};
      for(const [rawK,v] of Object.entries(raw)){
        const k=rawK.toLowerCase();
        const matchKey=Object.keys(this.LABEL_MAP).find(lbl=>k.includes(lbl));
        if(matchKey) picked[this.LABEL_MAP[matchKey]]=v;
      }
      return picked;
    }
  }

  window.CAB_Util = Util;
})();
