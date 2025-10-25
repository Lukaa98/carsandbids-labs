-- Migration number: 0004   2025-10-25T23:05:00.000Z
-- Purpose: Add finalBidPrice column to support unsold ("Bid to") auctions

PRAGMA foreign_keys=off;

BEGIN TRANSACTION;

ALTER TABLE auctionResults ADD COLUMN finalBidPrice INTEGER;

COMMIT;

PRAGMA foreign_keys=on;
