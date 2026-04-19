import axios from "axios";

const API_BASE = "https://backend.carsandbids-labs.workers.dev";
// local db
// const API_BASE = "http://127.0.0.1:8787";

/**
 * Fetch paginated and filtered auctions
 * @param {object} options - { page, limit, make, model, year }
 */
export async function fetchAuctions({
    page = 1,
    limit = 50,
    make = "",
    model = "",
    year = "",
    minHp = "",
    maxHp = "",
    minPrice = "",
    maxPrice = "",
    transmission = "",
    drivetrain = "",
    exteriorColor = "",
    interiorColor = "",
    saleType = "",
    sellerType = "",
}) {
    const params = {};
    if (page) params.page = page;
    if (limit) params.limit = limit;
    if (make) params.make = make;
    if (model) params.model = model;
    if (year) params.year = year;
    if (minHp) params.minHp = minHp;
    if (maxHp) params.maxHp = maxHp;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (transmission) params.transmission = transmission;
    if (drivetrain) params.drivetrain = drivetrain;
    if (exteriorColor) params.exteriorColor = exteriorColor;
    if (interiorColor) params.interiorColor = interiorColor;
    if (saleType) params.saleType = saleType;
    if (sellerType) params.sellerType = sellerType;

    const response = await axios.get(`${API_BASE}/auctions`, { params });
    return response.data;
}
