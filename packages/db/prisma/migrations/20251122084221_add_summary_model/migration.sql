-- CreateEnum
CREATE TYPE "SummaryStatusEnum" AS ENUM ('GENERATING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "SummaryTemplateEnum" AS ENUM ('COMPREHENSIVE', 'KEY_POINTS', 'CHAPTER_SUMMARY', 'CONCEPT_MAP', 'CUSTOM');

-- CreateTable
CREATE TABLE "Summary" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "content" TEXT,
    "status" "SummaryStatusEnum" NOT NULL DEFAULT 'GENERATING',
    "template" "SummaryTemplateEnum" NOT NULL DEFAULT 'COMPREHENSIVE',
    "subjectId" INTEGER,
    "sourceFileId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Summary_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Summary" ADD CONSTRAINT "Summary_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Summary" ADD CONSTRAINT "Summary_sourceFileId_fkey" FOREIGN KEY ("sourceFileId") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
