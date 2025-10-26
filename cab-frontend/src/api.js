import axios from "axios";

// Cloudflare Worker backend URL
const API_BASE = "https://backend.carsandbids-labs.workers.dev";

/**
 * Fetch paginated auctions
 * @param {number} page - Current page number
 * @param {number} limit - Number of auctions per page (default 50)
 */
export async function fetchAuctions(page = 1, limit = 50) {
    const response = await axios.get(`${API_BASE}/auctions`, {
        params: { page, limit },
    });
    return response.data; // { page, limit, total, totalPages, results }
}
