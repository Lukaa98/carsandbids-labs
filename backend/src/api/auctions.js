import { jsonResponse } from "../utils/responses.js";

export async function handleAuctions(env, url) {
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "50", 10);
  const offset = (page - 1) * limit;

  const make = url.searchParams.get("make");
  const model = url.searchParams.get("model");
  const year = url.searchParams.get("year");
  const minYear = url.searchParams.get("minYear");
  const maxYear = url.searchParams.get("maxYear");
  const minHp = url.searchParams.get("minHp");
  const maxHp = url.searchParams.get("maxHp");
  const minPrice = url.searchParams.get("minPrice");
  const maxPrice = url.searchParams.get("maxPrice");
  const transmission = url.searchParams.get("transmission");
  const drivetrain = url.searchParams.get("drivetrain");
  const bodyStyle = url.searchParams.get("bodyStyle");
  const exteriorColor = url.searchParams.get("exteriorColor");
  const interiorColor = url.searchParams.get("interiorColor");
  const saleType = url.searchParams.get("saleType");
  const sellerType = url.searchParams.get("sellerType");

  const where = [];
  const params = [];

  // --- Filters ---
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
  if (minYear) {
    where.push("year >= ?");
    params.push(Number(minYear));
  }
  if (maxYear) {
    where.push("year <= ?");
    params.push(Number(maxYear));
  }
  if (minHp) {
    where.push("horsepower >= ?");
    params.push(Number(minHp));
  }
  if (maxHp) {
    where.push("horsepower <= ?");
    params.push(Number(maxHp));
  }
  if (minPrice) {
    where.push("COALESCE(finalSalePrice, finalBidPrice) >= ?");
    params.push(Number(minPrice));
  }
  if (maxPrice) {
    where.push("COALESCE(finalSalePrice, finalBidPrice) <= ?");
    params.push(Number(maxPrice));
  }
  if (transmission) {
    if (transmission.toLowerCase() === "automatic") {
      where.push(
        "(LOWER(transmission) LIKE ? OR LOWER(transmission) LIKE ? OR LOWER(transmission) LIKE ?)"
      );
      params.push("%automatic%", "%auto%", "%pdk%");
    } else if (transmission.toLowerCase() === "manual") {
      where.push("LOWER(transmission) LIKE ?");
      params.push("%manual%");
    } else {
      where.push("LOWER(transmission) LIKE ?");
      params.push(`%${transmission.toLowerCase()}%`);
    }
  }
  if (drivetrain) {
    where.push("LOWER(drivetrain) LIKE ?");
    params.push(`%${drivetrain.toLowerCase()}%`);
  }
  if (bodyStyle) {
    where.push("LOWER(bodyStyle) LIKE ?");
    params.push(`%${bodyStyle.toLowerCase()}%`);
  }
  if (exteriorColor) {
    where.push("LOWER(exteriorColor) LIKE ?");
    params.push(`%${exteriorColor.toLowerCase()}%`);
  }
  if (interiorColor) {
    where.push("LOWER(interiorColor) LIKE ?");
    params.push(`%${interiorColor.toLowerCase()}%`);
  }
  if (saleType) {
    where.push("LOWER(saleType) LIKE ?");
    params.push(`%${saleType.toLowerCase()}%`);
  }
  if (sellerType) {
    if (sellerType.toLowerCase() === "private") {
      where.push("LOWER(sellerType) LIKE ?");
      params.push("%private%");
    } else if (sellerType.toLowerCase() === "dealer") {
      where.push("LOWER(sellerType) LIKE ?");
      params.push("%dealer%");
    } else {
      where.push("LOWER(sellerType) LIKE ?");
      params.push(`%${sellerType.toLowerCase()}%`);
    }
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  // --- Query results ---
  const { results } = await env.DB.prepare(
    `SELECT * FROM auctionResults
     ${whereClause}
     ORDER BY datetime(endDate) DESC, id DESC
     LIMIT ? OFFSET ?`
  )
    .bind(...params, limit, offset)
    .all();

  // --- Count total for pagination ---
  const countRow = await env.DB.prepare(
    `SELECT COUNT(*) AS count FROM auctionResults ${whereClause}`
  )
    .bind(...params)
    .first();

  const total = countRow?.count || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return jsonResponse({ page, limit, total, totalPages, results });
}
