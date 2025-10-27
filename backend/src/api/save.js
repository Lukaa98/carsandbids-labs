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

    // Prepare insert or update (UPSERT)
    const stmt = env.DB.prepare(`
      INSERT INTO auctionResults (
        auctionId, url, title,
        year, make, model, trim, bodyStyle, segment, exteriorColor, interiorColor,
        engine, drivetrain, transmission, mileage, mileageUnit, vin, titleStatus,
        sellerType, location,
        saleType, finalSalePrice, finalBidPrice, numBids, numComments, numViews, numWatchers, endDate,
        mainImageUrl, imageCount,
        rawVehicle, rawStatus, rawSeller, rawMedia
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(auctionId) DO UPDATE SET
        url = excluded.url,
        title = excluded.title,
        year = excluded.year,
        make = excluded.make,
        model = excluded.model,
        trim = excluded.trim,
        bodyStyle = excluded.bodyStyle,
        segment = excluded.segment,
        exteriorColor = excluded.exteriorColor,
        interiorColor = excluded.interiorColor,
        engine = excluded.engine,
        drivetrain = excluded.drivetrain,
        transmission = excluded.transmission,
        mileage = excluded.mileage,
        mileageUnit = excluded.mileageUnit,
        vin = excluded.vin,
        titleStatus = excluded.titleStatus,
        sellerType = excluded.sellerType,
        location = excluded.location,
        saleType = excluded.saleType,
        finalSalePrice = excluded.finalSalePrice,
        finalBidPrice = excluded.finalBidPrice,
        numBids = excluded.numBids,
        numComments = excluded.numComments,
        numViews = excluded.numViews,
        numWatchers = excluded.numWatchers,
        endDate = excluded.endDate,
        mainImageUrl = excluded.mainImageUrl,
        imageCount = excluded.imageCount,
        rawVehicle = excluded.rawVehicle,
        rawStatus = excluded.rawStatus,
        rawSeller = excluded.rawSeller,
        rawMedia = excluded.rawMedia
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
      status.finalBidPrice,
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
    console.log("✅ Upsert successful:", body.url);
    return jsonResponse({ ok: true, saved: body.url });
  } catch (err) {
    console.error("❌ D1 insert/update failed:", err.stack || err);
    return errorResponse(err);
  }
}
