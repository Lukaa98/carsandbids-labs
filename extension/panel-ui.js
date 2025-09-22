(() => {
  const Util = window.CAB_Util;

  class PanelUI {
    constructor() {
      this.css = `
        #${Util.PANEL_ID}{position:fixed;top:16px;left:16px;width:520px;height:60vh;z-index:2147483647;background:#fff;color:#111;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.12);display:flex;flex-direction:column;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial}
        #${Util.PANEL_ID} .cab-head{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid #f3f4f6;background:#fafafa;user-select:none}
        #${Util.PANEL_ID} .cab-title{font-weight:700;font-size:14px;letter-spacing:.2px}
        #${Util.PANEL_ID} .cab-actions{margin-left:auto;display:flex;gap:8px}
        #${Util.PANEL_ID} button{all:unset;cursor:pointer;padding:6px 10px;background:#111827;color:#fff;border-radius:8px;font-size:12px;line-height:1}
        #${Util.PANEL_ID} button.secondary{background:#e5e7eb;color:#111827}
        #${Util.PANEL_ID} .cab-body{flex:1;overflow:auto;padding:10px 12px;background:#fff;color:#111;font-size:12px;line-height:1.5;white-space:pre-wrap}
        #${Util.PANEL_ID} .cab-footer{border-top:1px solid #f3f4f6;padding:8px 12px;display:flex;gap:10px;align-items:center;background:#fafafa;font-size:12px;color:#374151}
        #${Util.PANEL_ID} .cab-meta{margin-left:auto;opacity:.8}
        #${Util.PANEL_ID} .cab-resize{position:absolute;right:6px;bottom:6px;width:14px;height:14px;cursor:nwse-resize;border-right:2px solid #cbd5e1;border-bottom:2px solid #cbd5e1;opacity:.7}
      `;
      this.panel = null;
      this.bodyNode = null;
      this.metaNode = null;
      this.handlers = {};
    }

    mount() {
      Util.ensureStyle(this.css);
      if (document.getElementById(Util.PANEL_ID)) return;

      const panel = document.createElement("div");
      panel.id = Util.PANEL_ID;
      panel.innerHTML = `
        <div class="cab-head">
          <div class="cab-title">C&B URL Collector + Details</div>
          <div class="cab-actions">
            <button class="cab-refresh">Rescan</button>
            <button class="cab-enrich secondary" title="Parse details for ALL URLs (any order)">Enrich All</button>
            <button class="cab-enrich-ordered secondary" title="Parse details preserving page order and including 'Ended …' text">Enrich (order+ended)</button>
            <button class="cab-close secondary">Close</button>
          </div>
        </div>
        <div class="cab-body"></div>
        <div class="cab-footer">
          <span>Shows all listing URLs on this page. “Enrich …” fetches details for every URL.</span>
          <span class="cab-meta"></span>
        </div>
        <div class="cab-resize" title="Drag to resize"></div>`;

      document.documentElement.appendChild(panel);

      this.panel = panel;
      this.bodyNode = panel.querySelector(".cab-body");
      this.metaNode = panel.querySelector(".cab-meta");

      panel.querySelector(".cab-close").onclick = () => panel.remove();
      panel.querySelector(".cab-refresh").onclick = () => this.handlers.onRefresh?.();
      panel.querySelector(".cab-enrich").onclick = () => this.handlers.onEnrich?.({ preserveOrder: false, includeEnded: false });
      panel.querySelector(".cab-enrich-ordered").onclick = () => this.handlers.onEnrich?.({ preserveOrder: true, includeEnded: true });

      const handle = panel.querySelector(".cab-resize");
      let resizing = false, startX = 0, startY = 0, startW = 0, startH = 0;
      const onMove = (e) => {
        if (!resizing) return;
        const dx = e.clientX - startX, dy = e.clientY - startY;
        panel.style.width = Math.max(360, startW + dx) + "px";
        panel.style.height = Math.max(260, startH + dy) + "px";
      };
      const onUp = () => {
        resizing = false;
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
      handle.addEventListener("mousedown", (e) => {
        e.preventDefault();
        resizing = true;
        startX = e.clientX; startY = e.clientY;
        const r = panel.getBoundingClientRect(); startW = r.width; startH = r.height;
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
      });
    }

    setHandlers({ onRefresh, onEnrich }) {
      this.handlers = { onRefresh, onEnrich };
    }

    setBody(text) {
      if (this.bodyNode) this.bodyNode.textContent = text;
    }

    // UPDATED: Adds "➕ Save" button for each block
    setBodyBlocks(blocks) {
      if (this.bodyNode) {
        this.bodyNode.innerHTML = "";

        blocks.forEach((block, idx) => {
          const pre = document.createElement("pre");
          pre.textContent = block;

          const btn = document.createElement("button");
          btn.textContent = "➕ Save";
          btn.className = "secondary";
          btn.style.margin = "6px 0";

          btn.onclick = async () => {
            try {
              const obj = JSON.parse(block);
              const res = await fetch("https://backend.carsandbids-labs.workers.dev/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(obj),
              });
              const out = await res.json();
              alert("Saved: " + JSON.stringify(out));
            } catch (e) {
              alert("Error saving: " + e);
            }
          };

          const wrapper = document.createElement("div");
          wrapper.style.marginBottom = "12px";
          wrapper.appendChild(pre);
          wrapper.appendChild(btn);

          this.bodyNode.appendChild(wrapper);
        });
      }
    }

    setMeta(text) {
      if (this.metaNode) this.metaNode.textContent = text;
    }
  }

  window.CAB_PanelUI = PanelUI;
})();
