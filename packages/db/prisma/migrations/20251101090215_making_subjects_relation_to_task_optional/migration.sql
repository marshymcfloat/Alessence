-- DropForeignKey
ALTER TABLE "public"."Task" DROP CONSTRAINT "Task_subjectId_fkey";

-- AlterTable
ALTER TABLE "Task" ALTER COLUMN "subjectId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
