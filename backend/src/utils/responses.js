import { corsHeaders } from "./cors.js";

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "content-type": "application/json", ...corsHeaders() }
  });
}

export function errorResponse(err, status = 500) {
  return jsonResponse({ ok: false, error: String(err) }, status);
}
