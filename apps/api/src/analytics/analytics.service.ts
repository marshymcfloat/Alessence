import { Injectable } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { AttemptStatusEnum, SessionStatusEnum, TaskStatusEnum } from '@repo/db';

export interface ExamScoreTrend {
  date: string;
  score: number;
  examId: number;
  examDescription: string;
  subjectId?: number;
  subjectTitle?: string;
}

export interface SubjectPerformance {
  subjectId: number;
  subjectTitle: string;
  averageScore: number;
  totalExams: number;
  totalAttempts: number;
  bestScore: number;
  worstScore: number;
}

export interface StudyTimeData {
  date: string;
  duration: number; // in seconds
  sessionCount: number;
}

export interface TaskCompletionData {
  date: string;
  completed: number;
  total: number;
  completionRate: number;
}

export interface WeakArea {
  subjectId: number;
  subjectTitle: string;
  averageScore: number;
  examCount: number;
  recommendation: string;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly dbService: DbService) {}

  async getExamScoreTrends(
    userId: string,
    days: number = 30,
  ): Promise<ExamScoreTrend[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const attempts = await this.dbService.examAttempt.findMany({
      where: {
        userId,
        status: AttemptStatusEnum.COMPLETED,
        score: { not: null },
        completedAt: { gte: startDate },
      },
      select: {
        completedAt: true,
        score: true,
        exam: {
          select: {
            id: true,
            description: true,
            subject: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        completedAt: 'asc',
      },
    });

    return attempts
      .filter((attempt) => attempt.completedAt)
      .map((attempt) => {
        const dateStr = attempt.completedAt!.toISOString().split('T')[0];
        return {
          date: dateStr || '',
          score: attempt.score!,
          examId: attempt.exam.id,
          examDescription: attempt.exam.description,
          subjectId: attempt.exam.subject?.id,
          subjectTitle: attempt.exam.subject?.title,
        };
      });
  }

  async getSubjectPerformance(userId: string): Promise<SubjectPerformance[]> {
    // Optimization: Use raw SQL to aggregate in DB instead of fetching all attempts
    // This significantly reduces data transfer and memory usage for users with many attempts.
    const results = await this.dbService.$queryRaw<
      {
        subjectId: number;
        subjectTitle: string;
        averageScore: number;
        bestScore: number;
        worstScore: number;
        totalAttempts: number;
        totalExams: number;
      }[]
    >`
      SELECT
        s."id" as "subjectId",
        s."title" as "subjectTitle",
        AVG(ea."score") as "averageScore",
        MAX(ea."score") as "bestScore",
        MIN(ea."score") as "worstScore",
        COUNT(ea."id")::int as "totalAttempts",
        COUNT(DISTINCT e."id")::int as "totalExams"
      FROM "ExamAttempt" ea
      JOIN "Exam" e ON ea."examId" = e."id"
      JOIN "Subject" s ON e."subjectId" = s."id"
      WHERE ea."userId" = ${userId}
        AND ea."status" = ${AttemptStatusEnum.COMPLETED}::"AttemptStatusEnum"
        AND ea."score" IS NOT NULL
      GROUP BY s."id", s."title"
    `;

    return results.map((result) => ({
      subjectId: result.subjectId,
      subjectTitle: result.subjectTitle,
      averageScore: Math.round(result.averageScore * 100) / 100,
      totalExams: result.totalExams,
      totalAttempts: result.totalAttempts,
      bestScore: Math.round(result.bestScore * 100) / 100,
      worstScore: Math.round(result.worstScore * 100) / 100,
    }));
  }

  async getStudyTimeAnalytics(
    userId: string,
    days: number = 30,
  ): Promise<StudyTimeData[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Optimization: Use raw SQL to aggregate in DB instead of fetching all sessions
    const results = await this.dbService.$queryRaw<
      { date: Date; duration: number; count: number }[]
    >`
      SELECT
        "completedAt"::date as "date",
        SUM("actualDuration")::int as "duration",
        COUNT(*)::int as "count"
      FROM "StudySession"
      WHERE "userId" = ${userId}
        AND "status" = ${SessionStatusEnum.COMPLETED}::"SessionStatusEnum"
        AND "completedAt" >= ${startDate}
        AND "actualDuration" IS NOT NULL
      GROUP BY "completedAt"::date
      ORDER BY "completedAt"::date ASC
    `;

    return results.map((r) => ({
      date: r.date.toISOString().split('T')[0],
      duration: r.duration,
      sessionCount: r.count,
    }));
  }

  async getTaskCompletionRates(
    userId: string,
    days: number = 30,
  ): Promise<TaskCompletionData[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const tasks = await this.dbService.task.findMany({
      where: {
        userId: userId, // Only return tasks owned by this user
        createdAt: { gte: startDate },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by date
    const dateMap = new Map<string, { completed: number; total: number }>();

    tasks.forEach((task) => {
      const dateStr = task.createdAt.toISOString().split('T')[0];
      if (!dateStr) return;
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, { completed: 0, total: 0 });
      }

      const data = dateMap.get(dateStr)!;
      data.total += 1;
      if (task.status === TaskStatusEnum.DONE) {
        data.completed += 1;
      }
    });

    return Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date,
        completed: data.completed,
        total: data.total,
        completionRate:
          data.total > 0 ? (data.completed / data.total) * 100 : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getWeakAreas(userId: string): Promise<WeakArea[]> {
    const subjectPerformance = await this.getSubjectPerformance(userId);

    // Identify weak areas (subjects with average score < 70%)
    const weakAreas = subjectPerformance
      .filter((subject) => subject.averageScore < 70 && subject.totalExams > 0)
      .map((subject) => ({
        subjectId: subject.subjectId,
        subjectTitle: subject.subjectTitle,
        averageScore: subject.averageScore,
        examCount: subject.totalExams,
        recommendation:
          subject.averageScore < 50
            ? 'Focus on fundamental concepts and review basic materials'
            : subject.averageScore < 60
              ? 'Practice more exam questions and review weak topics'
              : 'Continue practicing and focus on improving consistency',
      }))
      .sort((a, b) => a.averageScore - b.averageScore);

    return weakAreas;
  }
}
