import { jsonResponse } from "../utils/responses.js";

export async function handleAuctions(env, url) {
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "50", 10);
  const offset = (page - 1) * limit;

  // Query paginated results
  const { results } = await env.DB.prepare(
    `SELECT * FROM auctionResults 
     ORDER BY datetime(created_at) DESC 
     LIMIT ? OFFSET ?`
  )
    .bind(limit, offset)
    .all();

  // Count total number of auctions
  const countRow = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM auctionResults"
  ).first();
  const total = countRow?.count || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return jsonResponse({
    page,
    limit,
    total,
    totalPages,
    results,
  });
}
