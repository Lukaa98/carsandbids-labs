import { handleAuctions } from "./api/auctions.js";
import { handleCompAnalytics } from "./api/analytics.js";
import { handleSave } from "./api/save.js";
import { handleOptions } from "./utils/cors.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return handleOptions();
    }

    // GET /auctions → list results
    if (request.method === "GET" && url.pathname === "/auctions") {
      return handleAuctions(env, url);
    }

    // GET /analytics/comps → returns analytics of the auction
    if (request.method === "GET" && url.pathname === "/analytics/comps") {
      return handleCompAnalytics(env, url);
    }
    // POST /save → insert one row
    if (request.method === "POST" && url.pathname === "/save") {
      return handleSave(request, env);
    }

    // Default 404
    return new Response("Not found", { status: 404 });
  },
};
