import { jsonResponse, errorResponse } from "../utils/responses.js";

export async function handleSave(request, env) {
  try {
    const body = await request.json();
    console.log("📩 Received:", body.url);

    const v = body.vehicle || {};
    const s = v.specs || {};
    const b = v.body || {};
    const status = body.status || {};
    const seller = body.seller || {};
    const media = body.media || {};

    const stmt = env.DB.prepare(`
      INSERT INTO auctionResults (
        auctionId, url, title,
        year, make, model, trim, bodyStyle, segment, exteriorColor, interiorColor,
        engine, drivetrain, transmission, mileage, mileageUnit, vin, titleStatus,
        sellerType, location,
        saleType, finalSalePrice, numBids, numComments, numViews, numWatchers, endDate,
        mainImageUrl, imageCount,
        rawVehicle, rawStatus, rawSeller, rawMedia
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(auctionId) DO NOTHING
    `).bind(
      body.auctionId,
      body.url,
      body.title,

      v.year,
      v.make,
      v.model,
      v.trim,
      b.style,
      b.segment,
      b.colorExterior,
      b.colorInterior,
      s.engine,
      s.drivetrain,
      s.transmission,
      v.mileage?.value,
      v.mileage?.unit,
      v.vin,
      v.titleStatus,

      seller.type,
      seller.location,

      status.saleType,
      status.finalSalePrice,
      status.numBids,
      status.numComments,
      status.numViews,
      status.numWatchers,
      status.endDate,

      media.mainImageUrl,
      media.imageCount,

      JSON.stringify(v),
      JSON.stringify(status),
      JSON.stringify(seller),
      JSON.stringify(media)
    );

    await stmt.run();
    console.log("✅ Inserted successfully:", body.url);
    return jsonResponse({ ok: true, saved: body.url });
  } catch (err) {
    console.error("❌ D1 insert failed:", err.stack || err);
    return errorResponse(err);
  }
}
