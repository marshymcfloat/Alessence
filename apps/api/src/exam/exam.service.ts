import { Injectable, Logger } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { FileService } from 'src/file/file.service';
import { GeminiService } from 'src/gemini/gemini.service';
import { ExamStatusEnum, QuestionTypeEnum } from '@repo/db';
import { AuthenticatedUser } from 'src/auth/decorator/get-user.decorator';
import { CreateExamDto } from '@repo/types/nest';
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
  ) {}

  async create(
    dto: CreateExamDto,
    newFiles: MulterFile[],
    user: AuthenticatedUser,
  ): Promise<Exam> {
    if (!user?.userId) {
      throw new Error('User authentication is required');
    }

    let newFileIds: number[] = [];

    if (newFiles && newFiles.length > 0) {
      const createdFiles =
        await this.fileService.createMultipleFilesWithEmbeddings(newFiles, user.userId);
      newFileIds = createdFiles.map((file) => file.id);
    }

    // Validate that all existing file IDs belong to the user OR are shared with them
    if (dto.existingFileIds && dto.existingFileIds.length > 0) {
      const requestedFileIds = dto.existingFileIds.map((id) => +id);
      
      const existingFiles = await this.dbService.file.findMany({
        where: {
          id: { in: requestedFileIds },
        },
        select: {
          id: true,
          userId: true,
        },
      });

      // Check if all files exist
      const fileIdsSet = new Set(existingFiles.map((f) => f.id));
      const requestedFileIdsSet = new Set(requestedFileIds);

      if (fileIdsSet.size !== requestedFileIdsSet.size) {
        throw new Error('One or more requested files do not exist');
      }

      // Check which files don't belong to the user (need to check if shared)
      const notOwnedFileIds = existingFiles
        .filter((file) => file.userId !== user.userId)
        .map((file) => file.id);

      if (notOwnedFileIds.length > 0) {
        // Check if these files are shared with the user
        const sharedFiles = await this.dbService.sharedFile.findMany({
          where: {
            fileId: { in: notOwnedFileIds },
            recipientId: user.userId,
          },
          select: {
            fileId: true,
          },
        });

        const sharedFileIds = new Set(sharedFiles.map((sf) => sf.fileId));
        const unauthorizedFiles = notOwnedFileIds.filter(
          (id) => !sharedFileIds.has(id),
        );

        if (unauthorizedFiles.length > 0) {
          throw new Error(
            'You do not have permission to use one or more of the selected files',
          );
        }
      }
    }

    const allSourceFileIds = [...(dto.existingFileIds || []), ...newFileIds];

    if (allSourceFileIds.length === 0) {
      throw new Error('An exam must have at least one source file.');
    }

    // Validate that the subject belongs to the user
    const subject = await this.dbService.subject.findFirst({
      where: {
        id: +dto.subjectId,
        userId: user.userId,
      },
    });

    if (!subject) {
      throw new Error('Subject not found or you do not have permission to use it');
    }

    const exam = await this.dbService.exam.create({
      data: {
        description: dto.describe,
        requestedItems: +dto.items,
        status: ExamStatusEnum.GENERATING,
        subjectId: +dto.subjectId,
        questionTypes: dto.questionTypes as QuestionTypeEnum[],
        isPracticeMode: dto.isPracticeMode || false,
        timeLimit: dto.timeLimit ? +dto.timeLimit : null,
        userId: user.userId, // Set user ownership
        sourceFiles: {
          connect: allSourceFileIds.map((id) => ({ id: +id })),
        },
      },
    });

    this.eventEmitter.emit('exam.created', exam);

    this.logger.log(
      `Exam [ID: ${exam.id}] created. Emitting 'exam.created' event.`,
    );

    return exam;
  }

  async findAll(userId: string, subjectId?: number): Promise<any[]> {
    const exams = await this.dbService.exam.findMany({
      where: {
        userId: userId, // Only return exams owned by this user
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
      throw new Error('Exam not found or you do not have permission to delete it.');
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

      if (!context.trim()) {
        throw new Error('Source files contain no text content.');
      }

      this.logger.log(
        `Generating ${exam.requestedItems} questions for Exam [ID: ${exam.id}]...`,
      );
      const generatedQuestions = await this.geminiService.generateExamQuestions(
        context,
        examWithFiles.description,
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

    const isCorrect = await this.geminiService.evaluateAnswer(
      userAnswer,
      question.correctAnswer,
      question.text,
    );

    return { isCorrect };
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

        const isCorrect = await this.geminiService.evaluateAnswer(
          userAnswer,
          question.correctAnswer,
          question.text,
        );

        return { questionId, isCorrect };
      }),
    );

    return evaluations;
  }
}
