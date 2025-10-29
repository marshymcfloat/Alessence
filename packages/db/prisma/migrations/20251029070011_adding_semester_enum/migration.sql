-- CreateEnum
CREATE TYPE "SemesterEnum" AS ENUM ('FIRST', 'SECOND');

-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "sem" "SemesterEnum" NOT NULL DEFAULT 'FIRST';
