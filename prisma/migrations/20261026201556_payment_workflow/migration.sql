-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'AWAITING_PAYMENT';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "paymentConfigSnapshot" JSONB;
