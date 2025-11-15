/*
  Warnings:

  - You are about to drop the column `creataedAt` on the `Task` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AcceptedFileType" AS ENUM ('PDF', 'TEXT', 'DOCX');

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "creataedAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "File" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "type" "AcceptedFileType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "subjectId" INTEGER,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
