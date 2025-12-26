import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  StudySession,
  SessionStatusEnum,
  SessionTypeEnum,
} from '@repo/db';
import {
  CreateStudySessionDTO,
  UpdateStudySessionDTO,
} from '@repo/types/nest';
import { DbService } from 'src/db/db.service';

@Injectable()
export class StudySessionService {
  constructor(private readonly dbService: DbService) {}

  async create(
    createSessionDto: CreateStudySessionDTO,
    userId: string,
  ): Promise<StudySession> {
    const { type, duration, subjectId } = createSessionDto;

    const newSession = await this.dbService.studySession.create({
      data: {
        type,
        duration,
        subjectId: subjectId ?? null,
        userId,
        status: SessionStatusEnum.IN_PROGRESS,
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

    return newSession;
  }

  async getAll(userId: string): Promise<StudySession[]> {
    const sessions = await this.dbService.studySession.findMany({
      where: {
        userId: userId, // Only return sessions owned by this user
      },
      include: {
        subject: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    return sessions;
  }

  async getById(id: number, userId: string): Promise<StudySession> {
    const session = await this.dbService.studySession.findFirst({
      where: {
        id,
        userId,
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

    if (!session) {
      throw new NotFoundException('Study session not found');
    }

    return session;
  }

  async update(
    id: number,
    updateSessionDto: UpdateStudySessionDTO,
    userId: string,
  ): Promise<StudySession> {
    const session = await this.getById(id, userId);

    const updateData: any = {};

    if (updateSessionDto.status !== undefined) {
      updateData.status = updateSessionDto.status;
      
      // If completing the session, set completedAt and calculate actual duration
      if (updateSessionDto.status === SessionStatusEnum.COMPLETED) {
        updateData.completedAt = new Date();
        const startedAt = new Date(session.startedAt);
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
        const totalPausedDuration = updateSessionDto.pausedDuration ?? session.pausedDuration ?? 0;
        updateData.actualDuration = Math.max(0, elapsed - totalPausedDuration);
        
        // Ensure completedAt is set even if it wasn't set before
        if (!updateData.completedAt) {
          updateData.completedAt = new Date();
        }
      }
    }

    if (updateSessionDto.actualDuration !== undefined) {
      updateData.actualDuration = updateSessionDto.actualDuration;
    }

    if (updateSessionDto.pausedDuration !== undefined) {
      updateData.pausedDuration = updateSessionDto.pausedDuration;
    }

    try {
      const updatedSession = await this.dbService.studySession.update({
        where: { id },
        data: updateData,
        include: {
          subject: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      return updatedSession;
    } catch (error) {
      console.error('Error updating study session', error);
      throw new BadRequestException('Failed to update study session');
    }
  }

  async delete(id: number, userId: string): Promise<void> {
    const session = await this.getById(id, userId);

    try {
      await this.dbService.studySession.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error deleting study session', error);
      throw new BadRequestException('Failed to delete study session');
    }
  }

  async getActiveSession(userId: string): Promise<StudySession | null> {
    const activeSession = await this.dbService.studySession.findFirst({
      where: {
        userId,
        status: {
          in: [SessionStatusEnum.IN_PROGRESS, SessionStatusEnum.PAUSED],
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
      orderBy: {
        startedAt: 'desc',
      },
    });

    return activeSession;
  }
}

