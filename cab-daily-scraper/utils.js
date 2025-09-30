// utils.js
export const LABEL_MAP = {
  make: "make",
  model: "model",
  mileage: "mileage",
  vin: "vin",
  "title status": "titleStatus",
  location: "location",
  seller: "seller",
  engine: "engine",
  drivetrain: "drivetrain",
  transmission: "transmission",
  "body style": "bodyStyle",
  "exterior color": "exteriorColor",
  "interior color": "interiorColor",
  "seller type": "sellerType",
};

export function normalizeFields(obj) {
  const out = { ...obj };
  if (out.mileage) {
    out.mileage = out.mileage.replace(/(\d),\s+(\d{3})/g, "$1,$2");
  }
  return out;
}

export function pickFields(raw) {
  const picked = {};
  for (const [rawK, v] of Object.entries(raw)) {
    const k = rawK.toLowerCase();
    const matchKey = Object.keys(LABEL_MAP).find((lbl) => k.includes(lbl));
    if (matchKey) picked[LABEL_MAP[matchKey]] = v;
  }
  return picked;
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
