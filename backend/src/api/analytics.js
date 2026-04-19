import { jsonResponse, errorResponse } from "../utils/responses.js";

function toFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function getListingPrice(auction) {
  return toFiniteNumber(auction.finalSalePrice) ?? toFiniteNumber(auction.finalBidPrice);
}

function getNumericValues(auctions, getter) {
  return auctions
    .map(getter)
    .map((value) => toFiniteNumber(value))
    .filter((value) => value !== null && value > 0);
}

function average(values) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function percentDelta(value, baseline) {
  if (!Number.isFinite(value) || !Number.isFinite(baseline) || baseline === 0) {
    return null;
  }
  return ((value - baseline) / baseline) * 100;
}

function buildInsights(targetAuction, summary) {
  if (!summary) return [];

  const listingPrice = getListingPrice(targetAuction);
  const priceVsComps = percentDelta(listingPrice, summary.avgAllPrice);
  const mileageVsComps = percentDelta(
    toFiniteNumber(targetAuction.mileage),
    summary.avgMileage
  );

  const insights = [];

  if (Number.isFinite(priceVsComps)) {
    insights.push(
      priceVsComps >= 0
        ? `This listing priced ${Math.round(priceVsComps)}% above the average comp.`
        : `This listing priced ${Math.abs(Math.round(priceVsComps))}% below the average comp.`
    );
  }

  if (Number.isFinite(mileageVsComps)) {
    insights.push(
      mileageVsComps >= 0
        ? `Mileage is ${Math.round(mileageVsComps)}% higher than the average comp.`
        : `Mileage is ${Math.abs(Math.round(mileageVsComps))}% lower than the average comp.`
    );
  }

  if (Number.isFinite(summary.sellThroughRate)) {
    insights.push(`${summary.sellThroughRate}% of matching comps ended in a sale.`);
  }

  return insights;
}

export async function handleCompAnalytics(env, url) {
  try {
    const make = url.searchParams.get("make") || "";
    const model = url.searchParams.get("model") || "";
    const auctionId = url.searchParams.get("auctionId") || "";
    const targetYear = toFiniteNumber(url.searchParams.get("year"));
    const targetMileage = url.searchParams.get("mileage");
    const targetFinalSalePrice = url.searchParams.get("finalSalePrice");
    const targetFinalBidPrice = url.searchParams.get("finalBidPrice");
    const yearWindow = toFiniteNumber(url.searchParams.get("yearWindow")) ?? 3;
    const limit = toFiniteNumber(url.searchParams.get("limit")) ?? 150;

    if (!make || !model) {
      return errorResponse("Missing make or model", 400);
    }

    const where = ["LOWER(make) = ?", "LOWER(model) = ?"];
    const params = [make.toLowerCase(), model.toLowerCase()];

    if (auctionId) {
      where.push("auctionId != ?");
      params.push(auctionId);
    }

    if (targetYear !== null) {
      where.push("year BETWEEN ? AND ?");
      params.push(targetYear - yearWindow, targetYear + yearWindow);
    }

    const { results } = await env.DB.prepare(
      `SELECT * FROM auctionResults
       WHERE ${where.join(" AND ")}
       ORDER BY datetime(endDate) DESC, id DESC
       LIMIT ?`
    )
      .bind(...params, limit)
      .all();

    const soldAuctions = results.filter((item) => toFiniteNumber(item.finalSalePrice));
    const soldPrices = getNumericValues(soldAuctions, (item) => item.finalSalePrice);
    const allPrices = getNumericValues(results, getListingPrice);
    const mileageValues = getNumericValues(results, (item) => item.mileage);
    const bidValues = getNumericValues(results, (item) => item.numBids);

    const summary = {
      compCount: results.length,
      avgSoldPrice: average(soldPrices),
      medianSoldPrice: median(soldPrices),
      sellThroughRate: results.length
        ? Math.round((soldAuctions.length / results.length) * 100)
        : 0,
      avgMileage: average(mileageValues),
      avgBids: average(bidValues),
      avgAllPrice: average(allPrices),
    };

    const insights = buildInsights(
      {
        mileage: targetMileage,
        finalSalePrice: targetFinalSalePrice,
        finalBidPrice: targetFinalBidPrice,
      },
      summary
    );

    return jsonResponse({
      ok: true,
      summary,
      insights,
      results,
      meta: {
        make,
        model,
        year: targetYear,
        yearWindow,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
