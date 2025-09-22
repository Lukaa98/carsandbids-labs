export function handleOptions() {
  return new Response(null, { headers: corsHeaders() });
}

export function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400"
  };
}
