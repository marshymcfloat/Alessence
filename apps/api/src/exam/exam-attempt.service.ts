import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { AttemptStatusEnum } from '@repo/db';
import { GeminiService } from 'src/gemini/gemini.service';

export interface StartAttemptResult {
  attemptId: number;
  examId: number;
  startedAt: Date;
  timeLimit: number | null;
  questions: Array<{
    id: number;
    text: string;
    type: string;
    options: any;
  }>;
}

export interface SubmitAttemptResult {
  attemptId: number;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeTaken: number; // in seconds
  results: Array<{
    questionId: number;
    isCorrect: boolean;
    userAnswer: string;
    correctAnswer: string;
  }>;
}

@Injectable()
export class ExamAttemptService {
  constructor(
    private readonly dbService: DbService,
    private readonly geminiService: GeminiService,
  ) {}

  /**
   * Start a new exam attempt
   */
  async startAttempt(
    examId: number,
    userId: string,
  ): Promise<StartAttemptResult> {
    // Get the exam and verify ownership
    const exam = await this.dbService.exam.findFirst({
      where: {
        id: examId,
        userId,
      },
      include: {
        questions: {
          select: {
            id: true,
            text: true,
            type: true,
            options: true,
          },
        },
        _count: {
          select: { attempts: true },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found or you do not have access to it.');
    }

    if (exam.status !== 'READY') {
      throw new BadRequestException('This exam is not ready yet.');
    }

    // Check for practice mode and attempt limits
    if (!exam.isPracticeMode) {
      // Check if user already has a completed attempt
      const existingAttempt = await this.dbService.examAttempt.findFirst({
        where: {
          examId,
          userId,
          status: AttemptStatusEnum.COMPLETED,
        },
      });

      if (existingAttempt) {
        throw new BadRequestException(
          'You have already completed this exam. Enable practice mode to retake it.',
        );
      }
    }

    // Check for any in-progress attempt
    const inProgressAttempt = await this.dbService.examAttempt.findFirst({
      where: {
        examId,
        userId,
        status: AttemptStatusEnum.IN_PROGRESS,
      },
    });

    if (inProgressAttempt) {
      // Return the existing in-progress attempt
      return {
        attemptId: inProgressAttempt.id,
        examId: exam.id,
        startedAt: inProgressAttempt.startedAt,
        timeLimit: exam.timeLimit,
        questions: exam.questions.map((q) => ({
          id: q.id,
          text: q.text,
          type: q.type,
          options: q.options,
        })),
      };
    }

    // Create a new attempt
    const attempt = await this.dbService.examAttempt.create({
      data: {
        examId,
        userId,
        status: AttemptStatusEnum.IN_PROGRESS,
      },
    });

    return {
      attemptId: attempt.id,
      examId: exam.id,
      startedAt: attempt.startedAt,
      timeLimit: exam.timeLimit,
      questions: exam.questions.map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        options: q.options,
      })),
    };
  }

  /**
   * Submit answers and complete an exam attempt
   */
  async submitAttempt(
    examId: number,
    attemptId: number,
    userId: string,
    answers: Array<{ questionId: number; userAnswer: string }>,
  ): Promise<SubmitAttemptResult> {
    // Find the attempt
    const attempt = await this.dbService.examAttempt.findFirst({
      where: {
        id: attemptId,
        examId,
        userId,
      },
      include: {
        exam: {
          include: {
            questions: true,
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found or you do not have access to it.');
    }

    if (attempt.status === AttemptStatusEnum.COMPLETED) {
      throw new BadRequestException('This attempt has already been completed.');
    }

    // Check if time limit was exceeded
    const now = new Date();
    const timeTaken = Math.floor(
      (now.getTime() - attempt.startedAt.getTime()) / 1000,
    );

    if (attempt.exam.timeLimit) {
      const timeLimitSeconds = attempt.exam.timeLimit * 60;
      if (timeTaken > timeLimitSeconds + 10) {
        // Allow 10 seconds grace period
        throw new BadRequestException('Time limit exceeded. Your attempt has been invalidated.');
      }
    }

    // Create a map of questions for quick lookup
    const questionMap = new Map(
      attempt.exam.questions.map((q) => [q.id, q]),
    );

    // Evaluate answers
    const evaluatedAnswers = await Promise.all(
      answers.map(async ({ questionId, userAnswer }) => {
        const question = questionMap.get(questionId);
        if (!question) {
          return {
            questionId,
            userAnswer,
            correctAnswer: '',
            isCorrect: false,
          };
        }

        const isCorrect = await this.geminiService.evaluateAnswer(
          userAnswer,
          question.correctAnswer,
          question.text,
        );

        return {
          questionId,
          userAnswer,
          correctAnswer: question.correctAnswer,
          isCorrect,
        };
      }),
    );

    // Calculate score
    const correctAnswers = evaluatedAnswers.filter((a) => a.isCorrect).length;
    const totalQuestions = attempt.exam.questions.length;
    const score = (correctAnswers / totalQuestions) * 100;

    // Save answers and update attempt in a transaction
    await this.dbService.$transaction(async (tx) => {
      // Create user answers
      await tx.userAnswer.createMany({
        data: evaluatedAnswers.map((answer) => ({
          examAttemptId: attemptId,
          questionId: answer.questionId,
          selectedAnswer: answer.userAnswer,
          isCorrect: answer.isCorrect,
        })),
        skipDuplicates: true,
      });

      // Update attempt status
      await tx.examAttempt.update({
        where: { id: attemptId },
        data: {
          status: AttemptStatusEnum.COMPLETED,
          completedAt: now,
          score,
        },
      });
    });

    return {
      attemptId,
      score,
      correctAnswers,
      totalQuestions,
      timeTaken,
      results: evaluatedAnswers,
    };
  }

  /**
   * Get attempt count for an exam
   */
  async getAttemptCount(examId: number, userId: string): Promise<number> {
    return this.dbService.examAttempt.count({
      where: {
        examId,
        userId,
        status: AttemptStatusEnum.COMPLETED,
      },
    });
  }

  /**
   * Get current in-progress attempt if any
   */
  async getInProgressAttempt(
    examId: number,
    userId: string,
  ): Promise<{ attemptId: number; startedAt: Date } | null> {
    const attempt = await this.dbService.examAttempt.findFirst({
      where: {
        examId,
        userId,
        status: AttemptStatusEnum.IN_PROGRESS,
      },
    });

    if (!attempt) return null;

    return {
      attemptId: attempt.id,
      startedAt: attempt.startedAt,
    };
  }

  /**
   * Abandon an in-progress attempt
   */
  async abandonAttempt(attemptId: number, userId: string): Promise<void> {
    const attempt = await this.dbService.examAttempt.findFirst({
      where: {
        id: attemptId,
        userId,
        status: AttemptStatusEnum.IN_PROGRESS,
      },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found.');
    }

    await this.dbService.examAttempt.update({
      where: { id: attemptId },
      data: {
        status: AttemptStatusEnum.ABANDONED,
        completedAt: new Date(),
      },
    });
  }
}

