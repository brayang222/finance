-- Adds nullable columns so deleting a fiado "abono" can reverse the account
-- balance and the linked Finance ingreso row it created (DIAN consignaciones fix).
ALTER TABLE "FiadoMovement" ADD COLUMN "accountId" TEXT;
ALTER TABLE "FiadoMovement" ADD COLUMN "financeId" TEXT;
