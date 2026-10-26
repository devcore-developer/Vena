-- CreateEnum
CREATE TYPE "AcademicYear" AS ENUM ('YEAR_1', 'YEAR_2', 'YEAR_3', 'YEAR_4', 'YEAR_5');

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "targetYear" "AcademicYear";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "academicYear" "AcademicYear";
