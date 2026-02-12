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
}) {
    const params = {};
    if (page) params.page = page;
    if (limit) params.limit = limit;
    if (make) params.make = make;
    if (model) params.model = model;
    if (year) params.year = year;
    if (minHp) params.minHp = minHp;
    if (maxHp) params.maxHp = maxHp;

    const response = await axios.get(`${API_BASE}/auctions`, { params });
    return response.data;
}
