import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { SessionStatusEnum } from '@repo/db';

export interface CalendarEvent {
  id: number;
  type: 'task' | 'exam' | 'study_session';
  title: string;
  date: string; // ISO date string
  startTime?: string; // ISO datetime string (optional)
  endTime?: string; // ISO datetime string (optional)
  color?: string;
  metadata?: any;
}

@Injectable()
export class CalendarService {
  constructor(private readonly dbService: DbService) {}

  async getCalendarEvents(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CalendarEvent[]> {
    const events: CalendarEvent[] = [];

    // Get tasks with deadlines
    const tasks = await this.dbService.task.findMany({
      where: {
        userId: userId, // Only return tasks owned by this user
        deadline: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        subject: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    tasks.forEach((task) => {
      events.push({
        id: task.id,
        type: 'task',
        title: task.title,
        date: task.deadline.toISOString().split('T')[0] || '',
        startTime: task.deadline.toISOString(),
        color: '#6366f1',
        metadata: {
          status: task.status,
          subject: task.subject,
          description: task.description,
        },
      });
    });

    // Get exams
    const exams = await this.dbService.exam.findMany({
      where: {
        userId: userId, // Only return exams owned by this user
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        subject: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    exams.forEach((exam) => {
      events.push({
        id: exam.id,
        type: 'exam',
        title: exam.description,
        date: exam.createdAt.toISOString().split('T')[0] || '',
        startTime: exam.createdAt.toISOString(),
        color: '#ec4899',
        metadata: {
          status: exam.status,
          subject: exam.subject,
        },
      });
    });

    // Get completed study sessions
    const studySessions = await this.dbService.studySession.findMany({
      where: {
        userId,
        status: SessionStatusEnum.COMPLETED,
        completedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        subject: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    studySessions.forEach((session) => {
      if (session.completedAt) {
        events.push({
          id: session.id,
          type: 'study_session',
          title: `Study Session - ${session.type}`,
          date: session.completedAt.toISOString().split('T')[0] || '',
          startTime: session.startedAt.toISOString(),
          endTime: session.completedAt.toISOString(),
          color: '#10b981',
          metadata: {
            type: session.type,
            duration: session.actualDuration,
            subject: session.subject,
          },
        });
      }
    });

    return events.sort((a, b) => {
      const dateA = new Date(a.startTime || a.date);
      const dateB = new Date(b.startTime || b.date);
      return dateA.getTime() - dateB.getTime();
    });
  }

  async getEventsForDate(userId: string, date: Date): Promise<CalendarEvent[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.getCalendarEvents(userId, startOfDay, endOfDay);
  }
}
