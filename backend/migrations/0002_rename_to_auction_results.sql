-- Migration number: 0002 	 2025-09-22T02:24:26.366Z
CREATE TABLE auctionResults (
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
