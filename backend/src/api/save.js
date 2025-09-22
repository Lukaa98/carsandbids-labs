import { jsonResponse, errorResponse } from "../utils/responses.js";

export async function handleSave(request, env) {
  try {
    const body = await request.json();

    const stmt = env.DB.prepare(`
      INSERT INTO auctionResults (
        url, title, make, model, mileage, vin, engine, drivetrain,
        transmission, bodyStyle, exteriorColor, interiorColor,
        titleStatus, location, seller
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(url) DO NOTHING
    `).bind(
      body.url,
      body.title,
      body.make,
      body.model,
      body.mileage,
      body.vin,
      body.engine,
      body.drivetrain,
      body.transmission,
      body.bodyStyle,
      body.exteriorColor,
      body.interiorColor,
      body.titleStatus,
      body.location,
      body.seller
    );

    await stmt.run();
    return jsonResponse({ ok: true, saved: body.url });
  } catch (err) {
    return errorResponse(err);
  }
}
