import { jsonResponse } from "../utils/responses.js";

export async function handleAuctions(env, url) {
  const limit = parseInt(url.searchParams.get("limit") || "20", 10);

  const { results } = await env.DB.prepare(
    "SELECT * FROM auctionResults ORDER BY created_at DESC LIMIT ?"
  ).bind(limit).all();

  return jsonResponse(results);
}
