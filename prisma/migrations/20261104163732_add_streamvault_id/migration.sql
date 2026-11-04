-- AlterTable
ALTER TABLE "CourseMedia" ADD COLUMN     "streamvaultId" TEXT;

-- CreateIndex
CREATE INDEX "CourseMedia_streamvaultId_idx" ON "CourseMedia"("streamvaultId");
