-- Per-user EMA chart preferences (period/color/visibility), so they follow
-- the account across devices instead of living in browser localStorage.
ALTER TABLE "UserConfig" ADD COLUMN "chartEmaConfig" TEXT;
