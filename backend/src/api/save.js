import { jsonResponse, errorResponse } from "../utils/responses.js";

function dbValue(value) {
  return value === undefined ? null : value;
}

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
        horsepower, torque,
        rawVehicle, rawStatus, rawSeller, rawMedia
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        horsepower = excluded.horsepower,
        torque = excluded.torque,
        rawVehicle = excluded.rawVehicle,
        rawStatus = excluded.rawStatus,
        rawSeller = excluded.rawSeller,
        rawMedia = excluded.rawMedia
    `).bind(
      dbValue(body.auctionId),
      dbValue(body.url),
      dbValue(body.title),

      dbValue(v.year),
      dbValue(v.make),
      dbValue(v.model),
      dbValue(v.trim),
      dbValue(b.style),
      dbValue(b.segment),
      dbValue(b.colorExterior),
      dbValue(b.colorInterior),
      dbValue(s.engine),
      dbValue(s.drivetrain),
      dbValue(s.transmission),
      dbValue(v.mileage?.value),
      dbValue(v.mileage?.unit),
      dbValue(v.vin),
      dbValue(v.titleStatus),

      dbValue(seller.type),
      dbValue(seller.location),

      dbValue(status.saleType),
      dbValue(status.finalSalePrice),
      dbValue(status.finalBidPrice),
      dbValue(status.numBids),
      dbValue(status.numComments),
      dbValue(status.numViews),
      dbValue(status.numWatchers),
      dbValue(status.endDate),

      dbValue(media.mainImageUrl),
      dbValue(media.imageCount),

      dbValue(s.horsepower),
      dbValue(s.torque),

      dbValue(JSON.stringify(v)),
      dbValue(JSON.stringify(status)),
      dbValue(JSON.stringify(seller)),
      dbValue(JSON.stringify(media))
    );

    await stmt.run();
    console.log("✅ Upsert successful:", body.url);
    return jsonResponse({ ok: true, saved: body.url });
  } catch (err) {
    console.error("❌ D1 insert/update failed:", err.stack || err);
    return errorResponse(err);
  }
}
