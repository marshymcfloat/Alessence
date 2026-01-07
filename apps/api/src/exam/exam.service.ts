import { Injectable, Logger } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { FileService } from 'src/file/file.service';
import { GeminiService } from 'src/gemini/gemini.service';
import { MockExamGeminiService } from 'src/gemini/mock-exam.service';
import { ExamStatusEnum, QuestionTypeEnum } from '@repo/db';
import { AuthenticatedUser } from 'src/auth/decorator/get-user.decorator';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import type { Exam, File, Prisma, Question } from '@repo/db';
type MulterFile = Express.Multer.File;

@Injectable()
export class ExamService {
  private readonly logger = new Logger(ExamService.name);

  constructor(
    private readonly dbService: DbService,
    private readonly fileService: FileService,
    private readonly eventEmitter: EventEmitter2,
    private readonly geminiService: GeminiService,
    private readonly mockExamGeminiService: MockExamGeminiService,
  ) {}

  async findAll(userId: string, subjectId?: number): Promise<any[]> {
    const exams = await this.dbService.exam.findMany({
      where: {
        userId: userId,
        ...(subjectId ? { subjectId } : {}),
      },
      include: {
        subject: {
          select: {
            id: true,
            title: true,
          },
        },
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
        attempts: {
          where: {
            userId,
            status: 'COMPLETED',
          },
          orderBy: {
            completedAt: 'desc',
          },
          take: 1,
          select: {
            id: true,
            score: true,
            completedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform to include useful attempt info
    return exams.map((exam) => ({
      ...exam,
      lastAttempt: exam.attempts[0] || null,
      attemptCount: exam._count.attempts,
      attempts: undefined, // Remove raw attempts array
    }));
  }

  async findOne(id: number, userId: string): Promise<Exam | null> {
    return this.dbService.exam.findFirst({
      where: {
        id,
        userId: userId, // Verify ownership
      },
      include: {
        subject: {
          select: {
            id: true,
            title: true,
          },
        },
        questions: {
          orderBy: {
            id: 'asc',
          },
        },
        sourceFiles: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async remove(id: number, userId: string): Promise<void> {
    // Verify ownership before deletion
    const exam = await this.dbService.exam.findFirst({
      where: { id, userId },
    });

    if (!exam) {
      throw new Error(
        'Exam not found or you do not have permission to delete it.',
      );
    }

    await this.dbService.exam.delete({
      where: { id },
    });
    this.logger.log(`Exam [ID: ${id}] deleted by user [${userId}].`);
  }

  @OnEvent('exam.created')
  async handleExamCreated(exam: Exam) {
    this.logger.log(`Handling 'exam.created' event for Exam [ID: ${exam.id}]`);

    try {
      const examWithFiles = (await this.dbService.exam.findUniqueOrThrow({
        where: { id: exam.id },
        include: { sourceFiles: true },
      })) as Exam & { sourceFiles: File[]; questionTypes: QuestionTypeEnum[] };

      const context = examWithFiles.sourceFiles
        .map((file) => file.contentText)
        .join('\n\n---\n\n');

      // Allowing empty context for AI-only knowledge generation
      this.logger.log(
        `Generating ${exam.requestedItems} questions for Exam [ID: ${exam.id}] ${context.trim() ? 'using source files' : 'from internal knowledge'}...`,
      );
      // Append instructions for standard exams (not mock)
      const standardExamInstructions = `
      IMPORTANT INSTRUCTION: 
      The generated questions MUST be strictly aligned with the content of the provided source files. 
      Ensure that the questions test critical requirements and deepen understanding of the specific topics covered in the files.
      Avoid generic questions; focus on the specific details, definitions, and concepts found in the context.`;

      const promptDescription = (exam as any).isMock
        ? examWithFiles.description
        : `${examWithFiles.description}\n${standardExamInstructions}`;

      const generatedQuestions = (exam as any).isMock
        ? await this.mockExamGeminiService.generateMockFinalsExam(
            context,
            promptDescription, // Use promptDescription (though for mock it's just description, mock service handles its own prompting mostly)
            examWithFiles.requestedItems,
            examWithFiles.questionTypes,
          )
        : await this.geminiService.generateExamQuestions(
            context,
            promptDescription,
            examWithFiles.requestedItems,
            examWithFiles.questionTypes,
          );

      if (!generatedQuestions || generatedQuestions.length === 0) {
        throw new Error(
          `No questions were generated for Exam [ID: ${exam.id}]. Expected ${exam.requestedItems} questions.`,
        );
      }

      this.logger.log(
        `Generated ${generatedQuestions.length} questions for Exam [ID: ${exam.id}]. Saving to database...`,
      );

      const validQuestions = generatedQuestions.filter((q) => {
        if (!q.text || !q.text.trim()) {
          this.logger.warn(
            `Skipping question with empty text for Exam [ID: ${exam.id}]`,
          );
          return false;
        }

        if (q.type !== QuestionTypeEnum.IDENTIFICATION) {
          if (
            !q.options ||
            !Array.isArray(q.options) ||
            q.options.length === 0
          ) {
            this.logger.warn(
              `Skipping question "${q.text.substring(0, 50)}..." with invalid options for Exam [ID: ${exam.id}]`,
            );
            return false;
          }
        }
        if (!q.correctAnswer || !q.correctAnswer.trim()) {
          this.logger.warn(
            `Skipping question "${q.text.substring(0, 50)}..." with empty correctAnswer for Exam [ID: ${exam.id}]`,
          );
          return false;
        }
        return true;
      });

      if (validQuestions.length === 0) {
        throw new Error(
          `No valid questions were generated for Exam [ID: ${exam.id}]. All questions failed validation.`,
        );
      }

      if (validQuestions.length < generatedQuestions.length) {
        this.logger.warn(
          `Filtered out ${generatedQuestions.length - validQuestions.length} invalid questions for Exam [ID: ${exam.id}].`,
        );
      }

      await this.dbService.$transaction(async (tx) => {
        await tx.question.createMany({
          data: validQuestions.map((q) => ({
            text: q.text.trim(),
            type: q.type || QuestionTypeEnum.MULTIPLE_CHOICE,
            options: (q.options &&
            Array.isArray(q.options) &&
            q.options.length > 0
              ? q.options
              : []) as Prisma.InputJsonValue,
            correctAnswer: q.correctAnswer.trim(),
            examId: exam.id,
          })),
        });

        await tx.exam.update({
          where: { id: exam.id },
          data: { status: ExamStatusEnum.READY },
        });
      });

      this.logger.log(
        `Successfully generated and saved ${validQuestions.length} questions for Exam [ID: ${exam.id}]. Status updated to READY.`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to generate exam [ID: ${exam.id}]: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );

      try {
        await this.dbService.exam.update({
          where: { id: exam.id },
          data: { status: ExamStatusEnum.FAILED },
        });
        this.logger.log(
          `Updated exam [ID: ${exam.id}] status to FAILED due to generation error.`,
        );
      } catch (updateError) {
        this.logger.error(
          `Failed to update exam [ID: ${exam.id}] status to FAILED: ${updateError instanceof Error ? updateError.message : String(updateError)}`,
        );
      }
    }
  }

  /**
   * Evaluates if a user's answer is correct for a specific question.
   * Uses AI-powered evaluation for longer answers, case-insensitive for short answers.
   */
  async evaluateAnswer(
    questionId: number,
    userAnswer: string,
  ): Promise<{ isCorrect: boolean }> {
    const question = await this.dbService.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new Error(`Question with ID ${questionId} not found.`);
    }

    const isCorrectResult = await this.geminiService.evaluateAnswer(
      userAnswer,
      question.correctAnswer,
      question.text,
    );

    return { isCorrect: isCorrectResult.isCorrect };
  }

  /**
   * Evaluates multiple answers at once for better performance.
   */
  async evaluateAnswers(
    answers: Array<{ questionId: number; userAnswer: string }>,
  ): Promise<Array<{ questionId: number; isCorrect: boolean }>> {
    const questionIds = answers.map((a) => a.questionId);
    const questions = await this.dbService.question.findMany({
      where: { id: { in: questionIds } },
    });

    const questionMap = new Map<number, Question>(
      questions.map((q) => [q.id, q]),
    );

    const evaluations = await Promise.all(
      answers.map(async ({ questionId, userAnswer }) => {
        const question = questionMap.get(questionId);
        if (!question) {
          this.logger.warn(
            `Question with ID ${questionId} not found. Marking as incorrect.`,
          );
          return { questionId, isCorrect: false };
        }

        const isCorrectResult = await this.geminiService.evaluateAnswer(
          userAnswer,
          question.correctAnswer,
          question.text,
        );

        return { questionId, isCorrect: isCorrectResult.isCorrect };
      }),
    );

    return evaluations;
  }
}
