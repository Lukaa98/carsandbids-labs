(() => {
  const Util = window.CAB_Util;

  class DetailExtractor {
    static async enrichOne(url){
      try{
        const doc=await Util.fetchDoc(url);
        const title=Util.extractTitle(doc);
        const raw=Util.extractSpecMap(doc);
        const fields=Util.normalizeFields(Util.pickFields(raw));
        if(Object.keys(fields).length>0){
          return { url, enriched:true, title: title || undefined, fieldsFound:Object.keys(fields).length, ...fields };
        }
      }catch(e){
        console.warn("[C&B] fetchDoc error:", e);
      }
      try{
        const doc2 = await Util.loadInIframe(url);
        const title2=Util.extractTitle(doc2);
        const raw2=Util.extractSpecMap(doc2);
        const fields2=Util.normalizeFields(Util.pickFields(raw2));
        return { url, enriched:true, title: title2 || undefined, fieldsFound:Object.keys(fields2).length, ...fields2 };
      }catch(e){
        console.error("[C&B] iframe fallback failed:", e);
        return { url, enriched:false, error:String(e) };
      }
    }
  }

  window.CAB_DetailExtractor = DetailExtractor;
})();
