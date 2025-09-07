(() => {
  const PanelUI = window.CAB_PanelUI;
  const Enricher = window.CAB_Enricher;

  class App {
    constructor(){
      this.panel = new PanelUI();
      this.enricher = new Enricher(this.panel);
    }
    start(){
      console.log("%c[C&B Extension] Content script loaded ✅","color: green; font-weight: bold;");
      this.panel.mount();
      this.panel.setHandlers({
        onRefresh: () => this.enricher.renderUrls(),
        onEnrich : (opts) => this.enricher.enrichAll(opts),
      });
      this.enricher.renderUrls();
    }
  }

  new App().start();
})();
