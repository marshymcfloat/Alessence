-- DropForeignKey
ALTER TABLE "public"."ExamAttempt" DROP CONSTRAINT "ExamAttempt_examId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Question" DROP CONSTRAINT "Question_examId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserAnswer" DROP CONSTRAINT "UserAnswer_examAttemptId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserAnswer" DROP CONSTRAINT "UserAnswer_questionId_fkey";

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAttempt" ADD CONSTRAINT "ExamAttempt_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAnswer" ADD CONSTRAINT "UserAnswer_examAttemptId_fkey" FOREIGN KEY ("examAttemptId") REFERENCES "ExamAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAnswer" ADD CONSTRAINT "UserAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
