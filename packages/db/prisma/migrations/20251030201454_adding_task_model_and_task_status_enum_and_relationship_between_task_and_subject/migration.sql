-- CreateEnum
CREATE TYPE "TaskStatusEnum" AS ENUM ('PLANNED', 'ON_PROGRESS', 'DONE');

-- CreateTable
CREATE TABLE "Task" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "deadlime" TIMESTAMP(3),
    "status" "TaskStatusEnum" NOT NULL DEFAULT 'PLANNED',
    "subjectId" INTEGER NOT NULL,
    "creataedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
