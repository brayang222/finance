-- Optional second funding source for stock/crypto purchases (e.g. broker
-- cash + a bank transfer) and second destination for sales' proceeds.
ALTER TABLE "Stock" ADD COLUMN "accountId2" TEXT;
ALTER TABLE "Stock" ADD COLUMN "accountName2" TEXT;
ALTER TABLE "Stock" ADD COLUMN "amount2" DOUBLE PRECISION;

ALTER TABLE "Crypto" ADD COLUMN "accountId2" TEXT;
ALTER TABLE "Crypto" ADD COLUMN "accountName2" TEXT;
ALTER TABLE "Crypto" ADD COLUMN "amount2" DOUBLE PRECISION;

-- Dividend payments per ticker.
CREATE TABLE "Dividend" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "shares" DOUBLE PRECISION,
    "perShare" DOUBLE PRECISION,
    "grossAmount" DOUBLE PRECISION,
    "adminCost" DOUBLE PRECISION,
    "tax" DOUBLE PRECISION,
    "accountId" TEXT,
    "accountName" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dividend_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Dividend_userId_ticker_idx" ON "Dividend"("userId", "ticker");

ALTER TABLE "Dividend" ADD CONSTRAINT "Dividend_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
