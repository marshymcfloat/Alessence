-- CreateEnum
CREATE TYPE "SessionTypeEnum" AS ENUM ('POMODORO', 'SHORT_BREAK', 'LONG_BREAK', 'CUSTOM');

-- CreateEnum
CREATE TYPE "SessionStatusEnum" AS ENUM ('IN_PROGRESS', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "StudySession" (
    "id" SERIAL NOT NULL,
    "type" "SessionTypeEnum" NOT NULL DEFAULT 'POMODORO',
    "duration" INTEGER NOT NULL,
    "actualDuration" INTEGER,
    "status" "SessionStatusEnum" NOT NULL DEFAULT 'IN_PROGRESS',
    "subjectId" INTEGER,
    "userId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "pausedDuration" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudySession_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "StudySession" ADD CONSTRAINT "StudySession_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudySession" ADD CONSTRAINT "StudySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

