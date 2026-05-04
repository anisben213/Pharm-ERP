-- Add rating to Supplier
ALTER TABLE "Supplier" ADD COLUMN "rating" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Add correctiveAction to Batch
ALTER TABLE "Batch" ADD COLUMN "correctiveAction" TEXT;

-- Add RETURNED to SalesStatus enum
ALTER TYPE "SalesStatus" ADD VALUE 'RETURNED';
