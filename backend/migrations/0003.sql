-- Migration number: 0002     2025-10-25T03:55:00.000Z

-- Updated schema for Cars & Bids backend (normalized + nested JSON)

CREATE TABLE auctionResults (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  auctionId TEXT UNIQUE,
  url TEXT NOT NULL,
  title TEXT,
  
  -- Flattened vehicle details
  year INTEGER,
  make TEXT,
  model TEXT,
  trim TEXT,
  bodyStyle TEXT,
  segment TEXT,
  exteriorColor TEXT,
  interiorColor TEXT,
  engine TEXT,
  drivetrain TEXT,
  transmission TEXT,
  mileage INTEGER,
  mileageUnit TEXT,
  vin TEXT,
  titleStatus TEXT,

  -- Seller info
  sellerType TEXT,
  location TEXT,

  -- Sale status summary
  saleType TEXT,
  finalSalePrice INTEGER,
  numBids INTEGER,
  numComments INTEGER,
  numViews INTEGER,
  numWatchers INTEGER,
  endDate TEXT,

  -- Media
  mainImageUrl TEXT,
  imageCount INTEGER,

  -- Raw nested JSON
  rawVehicle JSON,
  rawStatus JSON,
  rawSeller JSON,
  rawMedia JSON,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
