-- AlterTable: bolsillos dentro de una cuenta de alto rendimiento
ALTER TABLE "Hys" ADD COLUMN "parentId" TEXT;

ALTER TABLE "Hys" ADD CONSTRAINT "Hys_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "Hys"("id") ON DELETE CASCADE ON UPDATE CASCADE;
