-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'WAREHOUSE_KEEPER';
ALTER TYPE "Role" ADD VALUE 'LAB_TECHNICIAN';

-- AlterTable
ALTER TABLE "ProductionOrder" ADD COLUMN     "plannedDate" TIMESTAMP(3);
