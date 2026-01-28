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
    const attempts = await this.dbService.examAttempt.findMany({
      where: {
        userId,
        status: AttemptStatusEnum.COMPLETED,
        score: { not: null },
      },
      select: {
        score: true,
        exam: {
          select: {
            id: true,
            subject: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    // Group by subject
    const subjectMap = new Map<
      number,
      {
        subjectId: number;
        subjectTitle: string;
        scores: number[];
        examIds: Set<number>;
      }
    >();

    attempts.forEach((attempt) => {
      const subject = attempt.exam.subject;
      if (!subject) return;

      if (!subjectMap.has(subject.id)) {
        subjectMap.set(subject.id, {
          subjectId: subject.id,
          subjectTitle: subject.title,
          scores: [],
          examIds: new Set(),
        });
      }

      const data = subjectMap.get(subject.id)!;
      data.scores.push(attempt.score!);
      data.examIds.add(attempt.exam.id);
    });

    return Array.from(subjectMap.values()).map((data) => {
      const scores = data.scores;
      const averageScore =
        scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const bestScore = Math.max(...scores);
      const worstScore = Math.min(...scores);

      return {
        subjectId: data.subjectId,
        subjectTitle: data.subjectTitle,
        averageScore: Math.round(averageScore * 100) / 100,
        totalExams: data.examIds.size,
        totalAttempts: scores.length,
        bestScore: Math.round(bestScore * 100) / 100,
        worstScore: Math.round(worstScore * 100) / 100,
      };
    });
  }

  async getStudyTimeAnalytics(
    userId: string,
    days: number = 30,
  ): Promise<StudyTimeData[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const sessions = await this.dbService.studySession.findMany({
      where: {
        userId: userId, // Only return sessions owned by this user
        status: SessionStatusEnum.COMPLETED,
        completedAt: { gte: startDate },
        actualDuration: { not: null },
      },
      orderBy: {
        completedAt: 'asc',
      },
    });

    // Group by date
    const dateMap = new Map<string, { duration: number; count: number }>();

    sessions.forEach((session) => {
      if (!session.completedAt || !session.actualDuration) return;

      const dateStr = session.completedAt.toISOString().split('T')[0];
      if (!dateStr) return;
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, { duration: 0, count: 0 });
      }

      const data = dateMap.get(dateStr)!;
      data.duration += session.actualDuration;
      data.count += 1;
    });

    return Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date,
        duration: data.duration,
        sessionCount: data.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
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
