import { jsonResponse, errorResponse } from "../utils/responses.js";

export async function handleSave(request, env) {
  try {
    const body = await request.json();
    console.log("📩 Received:", body.url);

    // Defensive: ensure all bound values are strings (or null)
    const clean = (v) => (v === undefined ? null : v);

    const stmt = env.DB.prepare(`
      INSERT INTO auctionResults (
        url, title, make, model, mileage, vin, engine, drivetrain,
        transmission, bodyStyle, exteriorColor, interiorColor,
        titleStatus, location, seller
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(url) DO NOTHING
    `).bind(
      clean(body.url),
      clean(body.title),
      clean(body.make),
      clean(body.model),
      clean(body.mileage),
      clean(body.vin),
      clean(body.engine),
      clean(body.drivetrain),
      clean(body.transmission),
      clean(body.bodyStyle),
      clean(body.exteriorColor),
      clean(body.interiorColor),
      clean(body.titleStatus),
      clean(body.location),
      clean(body.seller)
    );

    await stmt.run();
    console.log("✅ Inserted successfully:", body.url);
    return jsonResponse({ ok: true, saved: body.url });
  } catch (err) {
    console.error("❌ D1 insert failed:", err.stack || err);
    return errorResponse(err);
  }
}
