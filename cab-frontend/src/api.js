import axios from "axios";

// Cloudflare Worker backend URL
const API_BASE = "https://backend.carsandbids-labs.workers.dev";

/**
 * Fetch all auction listings from backend
 */
export async function fetchAuctions() {
    const response = await axios.get(`${API_BASE}/auctions`);
    return response.data;
}
