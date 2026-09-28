-- New table for chart drawings (trendlines, Fibonacci, text, measurements),
-- scoped per user + ticker.
CREATE TABLE "ChartDrawing" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChartDrawing_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ChartDrawing_userId_ticker_idx" ON "ChartDrawing"("userId", "ticker");

ALTER TABLE "ChartDrawing" ADD CONSTRAINT "ChartDrawing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
