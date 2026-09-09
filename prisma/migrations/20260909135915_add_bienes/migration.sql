-- AlterTable
ALTER TABLE "UserConfig" ADD COLUMN     "showBienes" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "Bien" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bien_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Bien" ADD CONSTRAINT "Bien_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

