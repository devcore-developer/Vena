-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Permission" ADD VALUE 'VIEW_FINANCE';
ALTER TYPE "Permission" ADD VALUE 'MANAGE_FINANCE';

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "doctorBasePrice" DECIMAL(10,2),
ADD COLUMN     "platformCommissionRate" DECIMAL(5,4) DEFAULT 0.15;

-- AlterTable
ALTER TABLE "CourseLesson" ADD COLUMN     "courseId" TEXT,
ALTER COLUMN "sectionId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "CourseMedia" ADD COLUMN     "streamvaultHls" TEXT,
ADD COLUMN     "streamvaultIframe" TEXT,
ADD COLUMN     "streamvaultStatus" INTEGER DEFAULT 0,
ADD COLUMN     "streamvaultThumbnail" TEXT;

-- AlterTable
ALTER TABLE "FreeResource" ADD COLUMN     "streamvaultHls" TEXT,
ADD COLUMN     "streamvaultId" TEXT,
ADD COLUMN     "streamvaultIframe" TEXT,
ADD COLUMN     "streamvaultStatus" INTEGER DEFAULT 0,
ADD COLUMN     "streamvaultThumbnail" TEXT;

-- CreateIndex
CREATE INDEX "CourseLesson_courseId_idx" ON "CourseLesson"("courseId");

-- AddForeignKey
ALTER TABLE "CourseLesson" ADD CONSTRAINT "CourseLesson_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
