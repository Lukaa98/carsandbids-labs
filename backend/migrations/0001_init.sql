-- Migration number: 0001 	 2025-09-22T02:15:51.231Z

-- Initial schema for Cars & Bids backend
CREATE TABLE auctions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT UNIQUE,
  title TEXT,
  make TEXT,
  model TEXT,
  mileage TEXT,
  vin TEXT,
  engine TEXT,
  drivetrain TEXT,
  transmission TEXT,
  bodyStyle TEXT,
  exteriorColor TEXT,
  interiorColor TEXT,
  titleStatus TEXT,
  location TEXT,
  seller TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
