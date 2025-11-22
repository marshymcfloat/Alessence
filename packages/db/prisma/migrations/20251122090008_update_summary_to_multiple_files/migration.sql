/*
  Warnings:

  - You are about to drop the column `sourceFileId` on the `Summary` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Summary" DROP CONSTRAINT "Summary_sourceFileId_fkey";

-- AlterTable
ALTER TABLE "Summary" DROP COLUMN "sourceFileId";

-- CreateTable
CREATE TABLE "_FileToSummary" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_FileToSummary_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_FileToSummary_B_index" ON "_FileToSummary"("B");

-- AddForeignKey
ALTER TABLE "_FileToSummary" ADD CONSTRAINT "_FileToSummary_A_fkey" FOREIGN KEY ("A") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FileToSummary" ADD CONSTRAINT "_FileToSummary_B_fkey" FOREIGN KEY ("B") REFERENCES "Summary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
