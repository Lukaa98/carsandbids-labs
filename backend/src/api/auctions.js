import { jsonResponse } from "../utils/responses.js";

export async function handleAuctions(env, url) {
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "50", 10);
  const offset = (page - 1) * limit;

  const make = url.searchParams.get("make");
  const model = url.searchParams.get("model");
  const year = url.searchParams.get("year");

  let where = [];
  const params = [];

  if (make) {
    where.push("LOWER(make) LIKE ?");
    params.push(`%${make.toLowerCase()}%`);
  }
  if (model) {
    where.push("LOWER(model) LIKE ?");
    params.push(`%${model.toLowerCase()}%`);
  }
  if (year) {
    where.push("year = ?");
    params.push(Number(year));
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const { results } = await env.DB.prepare(
    `SELECT * FROM auctionResults
     ${whereClause}
     ORDER BY datetime(created_at) DESC
     LIMIT ? OFFSET ?`
  ).bind(...params, limit, offset).all();

  const countRow = await env.DB.prepare(
    `SELECT COUNT(*) AS count FROM auctionResults ${whereClause}`
  ).bind(...params).first();

  const total = countRow?.count || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return jsonResponse({ page, limit, total, totalPages, results });
}
