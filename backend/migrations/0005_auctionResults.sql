-- Migration number: 0005 	 2025-11-12T02:36:24.277Z

ALTER TABLE auctionResults ADD COLUMN horsepower INTEGER;
ALTER TABLE auctionResults ADD COLUMN torque INTEGER;
