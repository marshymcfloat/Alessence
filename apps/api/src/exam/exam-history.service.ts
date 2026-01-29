import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { AttemptStatusEnum } from '@repo/db';

export interface ExamAttemptHistory {
  id: number;
  score: number;
  status: AttemptStatusEnum;
  startedAt: Date;
  completedAt: Date | null;
  totalQuestions: number;
  correctAnswers: number;
  examId: number;
  examDescription: string;
  subjectId: number;
  subjectTitle: string;
}

export interface ExamComparisonData {
  attemptNumber: number;
  date: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  duration?: number; // in seconds
}

@Injectable()
export class ExamHistoryService {
  constructor(private readonly dbService: DbService) {}

  async getExamAttemptHistory(
    examId: number,
    userId: string,
  ): Promise<ExamAttemptHistory[]> {
    const attempts = await this.dbService.examAttempt.findMany({
      where: {
        examId,
        userId,
        status: AttemptStatusEnum.COMPLETED,
        score: { not: null },
      },
      include: {
        exam: {
          include: {
            subject: {
              select: {
                id: true,
                title: true,
              },
            },
            questions: {
              select: {
                id: true,
              },
            },
          },
        },
        answers: {
          where: {
            isCorrect: true,
          },
        },
      },
      orderBy: {
        completedAt: 'desc',
      },
    });

    return attempts.map((attempt) => ({
      id: attempt.id,
      score: attempt.score!,
      status: attempt.status,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt!,
      totalQuestions: attempt.exam.questions.length,
      correctAnswers: attempt.answers.length,
      examId: attempt.exam.id,
      examDescription: attempt.exam.description,
      subjectId: attempt.exam.subject.id,
      subjectTitle: attempt.exam.subject.title,
    }));
  }

  async getExamComparisonData(
    examId: number,
    userId: string,
  ): Promise<ExamComparisonData[]> {
    const attempts = await this.dbService.examAttempt.findMany({
      where: {
        examId,
        userId,
        status: AttemptStatusEnum.COMPLETED,
        score: { not: null },
        completedAt: { not: null },
      },
      include: {
        exam: {
          include: {
            questions: {
              select: {
                id: true,
              },
            },
          },
        },
        answers: {
          where: {
            isCorrect: true,
          },
        },
      },
      orderBy: {
        completedAt: 'asc',
      },
    });

    return attempts
      .filter((attempt) => attempt.completedAt)
      .map((attempt, index) => {
        const duration =
          attempt.completedAt && attempt.startedAt
            ? Math.floor(
                (attempt.completedAt.getTime() - attempt.startedAt.getTime()) /
                  1000,
              )
            : undefined;

        const dateStr = attempt.completedAt!.toISOString().split('T')[0];
        return {
          attemptNumber: index + 1,
          date: dateStr || '',
          score: attempt.score!,
          correctAnswers: attempt.answers.length,
          totalQuestions: attempt.exam.questions.length,
          duration,
        };
      });
  }

  async getAttemptDetails(attemptId: number, userId: string): Promise<any> {
    const attempt = await this.dbService.examAttempt.findFirst({
      where: {
        id: attemptId,
        userId,
      },
      include: {
        exam: {
          include: {
            subject: {
              select: {
                id: true,
                title: true,
              },
            },
            questions: {
              include: {
                userAnswers: {
                  where: {
                    examAttemptId: attemptId,
                  },
                },
              },
            },
          },
        },
        answers: true,
      },
    });

    if (!attempt) {
      return null;
    }

    return {
      id: attempt.id,
      score: attempt.score,
      status: attempt.status,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt,
      exam: {
        id: attempt.exam.id,
        description: attempt.exam.description,
        subject: attempt.exam.subject,
      },
      questions: attempt.exam.questions.map((question) => {
        const userAnswer = question.userAnswers[0];
        return {
          id: question.id,
          text: question.text,
          type: question.type,
          options: question.options,
          correctAnswer: question.correctAnswer,
          userAnswer: userAnswer?.selectedAnswer || null,
          isCorrect: userAnswer?.isCorrect || false,
        };
      }),
    };
  }

  async getWrongAnswers(examId: number, userId: string): Promise<any[]> {
    const attempts = await this.dbService.examAttempt.findMany({
      where: {
        examId,
        userId,
        status: AttemptStatusEnum.COMPLETED,
        score: { not: null },
      },
      include: {
        exam: {
          include: {
            subject: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        answers: {
          where: {
            isCorrect: false,
          },
          include: {
            question: true,
          },
        },
      },
      orderBy: {
        completedAt: 'desc',
      },
    });

    // Aggregate wrong answers by question
    const wrongAnswersMap = new Map<
      number,
      {
        question: any;
        attempts: Array<{
          attemptId: number;
          userAnswer: string;
          completedAt: Date;
          attemptNumber: number;
        }>;
        totalWrongAttempts: number;
      }
    >();

    attempts.forEach((attempt, attemptIndex) => {
      attempt.answers.forEach((answer) => {
        const questionId = answer.question.id;
        if (!wrongAnswersMap.has(questionId)) {
          wrongAnswersMap.set(questionId, {
            question: {
              id: answer.question.id,
              text: answer.question.text,
              type: answer.question.type,
              options: answer.question.options,
              correctAnswer: answer.question.correctAnswer,
            },
            attempts: [],
            totalWrongAttempts: 0,
          });
        }

        const entry = wrongAnswersMap.get(questionId)!;
        entry.attempts.push({
          attemptId: attempt.id,
          userAnswer: answer.selectedAnswer,
          completedAt: attempt.completedAt!,
          attemptNumber: attempts.length - attemptIndex,
        });
        entry.totalWrongAttempts = entry.attempts.length;
      });
    });

    return Array.from(wrongAnswersMap.values()).sort(
      (a, b) => b.totalWrongAttempts - a.totalWrongAttempts,
    );
  }

  async getWrongAnswerStatistics(examId: number, userId: string): Promise<any> {
    const attempts = await this.dbService.examAttempt.findMany({
      where: {
        examId,
        userId,
        status: AttemptStatusEnum.COMPLETED,
      },
      include: {
        answers: {
          where: {
            isCorrect: false,
          },
        },
        exam: {
          include: {
            questions: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    const totalQuestions = attempts[0]?.exam.questions.length || 0;
    const totalWrongAnswers = attempts.reduce(
      (sum, attempt) => sum + attempt.answers.length,
      0,
    );
    const uniqueWrongQuestions = new Set<number>();
    attempts.forEach((attempt) => {
      attempt.answers.forEach((answer) => {
        uniqueWrongQuestions.add(answer.questionId);
      });
    });

    return {
      totalAttempts: attempts.length,
      totalQuestions,
      totalWrongAnswers,
      uniqueWrongQuestions: uniqueWrongQuestions.size,
      wrongAnswerRate:
        totalQuestions > 0
          ? (uniqueWrongQuestions.size / totalQuestions) * 100
          : 0,
    };
  }
}
