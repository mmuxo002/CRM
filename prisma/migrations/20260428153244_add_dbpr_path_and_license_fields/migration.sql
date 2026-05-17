-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "licenseIssuedAt" TIMESTAMP(3),
ADD COLUMN     "newlyLicensed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "SalesProject" ADD COLUMN     "dbprFilters" JSONB,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'GOOGLE_GENERAL';
