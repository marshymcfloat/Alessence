/*
  Warnings:

  - You are about to drop the column `deadlime` on the `Task` table. All the data in the column will be lost.
  - Added the required column `deadline` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Task" DROP COLUMN "deadlime",
ADD COLUMN     "deadline" TIMESTAMP(3) NOT NULL;
