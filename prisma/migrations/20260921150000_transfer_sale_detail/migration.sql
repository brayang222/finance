-- Structured fields for stock/crypto sales, already computed but previously
-- only embedded in the free-text `note` (qty, commission) or absent
-- (detail: an optional user-entered reason for the sale).
ALTER TABLE "Transfer" ADD COLUMN "qty" DOUBLE PRECISION;
ALTER TABLE "Transfer" ADD COLUMN "commission" DOUBLE PRECISION;
ALTER TABLE "Transfer" ADD COLUMN "detail" TEXT;
