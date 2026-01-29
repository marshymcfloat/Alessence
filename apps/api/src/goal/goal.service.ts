import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StudyGoal, GoalPeriodEnum, SessionStatusEnum } from '@repo/db';
import { CreateGoalDTO, UpdateGoalDTO } from '@repo/types/nest';
import { DbService } from 'src/db/db.service';

@Injectable()
export class GoalService {
  constructor(private readonly dbService: DbService) {}

  async create(
    createGoalDto: CreateGoalDTO,
    userId: string,
  ): Promise<StudyGoal> {
    const { periodType, targetMinutes, subjectId, startDate } = createGoalDto;

    // Check if user already has an active goal of the same type and subject
    const existingGoal = await this.dbService.studyGoal.findFirst({
      where: {
        userId,
        periodType: periodType as GoalPeriodEnum,
        isActive: true,
        subjectId: subjectId ?? null,
      },
    });

    if (existingGoal) {
      throw new BadRequestException(
        `You already have an active ${periodType.toLowerCase()} goal${subjectId ? ' for this subject' : ''}. Please update or deactivate it first.`,
      );
    }

    const goal = await this.dbService.studyGoal.create({
      data: {
        periodType: periodType as GoalPeriodEnum,
        targetMinutes,
        subjectId: subjectId ?? null,
        userId,
        startDate: startDate ? new Date(startDate) : new Date(),
        isActive: true,
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

    return goal;
  }

  async getAll(userId: string): Promise<StudyGoal[]> {
    const goals = await this.dbService.studyGoal.findMany({
      where: {
        userId: userId, // Only return goals owned by this user
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
        createdAt: 'desc',
      },
    });

    return goals;
  }

  async getActiveGoals(userId: string): Promise<StudyGoal[]> {
    const goals = await this.dbService.studyGoal.findMany({
      where: {
        userId,
        isActive: true,
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
        createdAt: 'desc',
      },
    });

    return goals;
  }

  async getById(id: number, userId: string): Promise<StudyGoal> {
    const goal = await this.dbService.studyGoal.findFirst({
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

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    return goal;
  }

  async update(
    id: number,
    updateGoalDto: UpdateGoalDTO,
    userId: string,
  ): Promise<StudyGoal> {
    const goal = await this.getById(id, userId);

    const updatedGoal = await this.dbService.studyGoal.update({
      where: { id },
      data: {
        ...(updateGoalDto.periodType && {
          periodType: updateGoalDto.periodType as GoalPeriodEnum,
        }),
        ...(updateGoalDto.targetMinutes !== undefined && {
          targetMinutes: updateGoalDto.targetMinutes,
        }),
        ...(updateGoalDto.subjectId !== undefined && {
          subjectId: updateGoalDto.subjectId ?? null,
        }),
        ...(updateGoalDto.isActive !== undefined && {
          isActive: updateGoalDto.isActive,
        }),
        ...(updateGoalDto.startDate && {
          startDate: new Date(updateGoalDto.startDate),
        }),
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

    return updatedGoal;
  }

  async delete(id: number, userId: string): Promise<void> {
    const goal = await this.getById(id, userId);

    await this.dbService.studyGoal.delete({
      where: { id },
    });
  }

  /**
   * Calculate progress for a goal based on completed study sessions
   */
  async getGoalProgress(
    goalId: number,
    userId: string,
  ): Promise<{
    goal: StudyGoal;
    currentMinutes: number;
    targetMinutes: number;
    progressPercentage: number;
    periodStart: Date;
    periodEnd: Date;
  }> {
    const goal = await this.getById(goalId, userId);

    // Calculate period start and end dates
    const now = new Date();
    const startDate = new Date(goal.startDate);
    let periodStart: Date;
    let periodEnd: Date;

    if (goal.periodType === GoalPeriodEnum.DAILY) {
      // For daily goals, use the current day (UTC)
      periodStart = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
          0,
          0,
          0,
          0,
        ),
      );
      periodEnd = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
          23,
          59,
          59,
          999,
        ),
      );
    } else {
      // For weekly goals, find the start of the week (Monday) in UTC
      const dayOfWeek = now.getUTCDay();
      const diff = now.getUTCDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Sunday
      const mondayDate = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), diff, 0, 0, 0, 0),
      );
      periodStart = new Date(mondayDate);
      periodEnd = new Date(mondayDate);
      periodEnd.setUTCDate(periodStart.getUTCDate() + 6);
      periodEnd.setUTCHours(23, 59, 59, 999);
    }

    // Get completed study sessions within the period
    // Also include sessions that might have been completed today but completedAt is null (fallback)
    const sessions = await this.dbService.studySession.findMany({
      where: {
        userId,
        status: SessionStatusEnum.COMPLETED,
        OR: [
          {
            completedAt: {
              gte: periodStart,
              lte: periodEnd,
            },
          },
          // Fallback: if completedAt is null but status is COMPLETED and updated recently
          {
            completedAt: null,
            updatedAt: {
              gte: periodStart,
            },
          },
        ],
        ...(goal.subjectId && {
          subjectId: goal.subjectId,
        }),
      },
    });

    // Calculate total minutes from sessions
    const totalSeconds = sessions.reduce((sum, session) => {
      return sum + (session.actualDuration || 0);
    }, 0);

    const currentMinutes = Math.floor(totalSeconds / 60);
    const progressPercentage = Math.min(
      (currentMinutes / goal.targetMinutes) * 100,
      100,
    );

    return {
      goal,
      currentMinutes,
      targetMinutes: goal.targetMinutes,
      progressPercentage,
      periodStart,
      periodEnd,
    };
  }

  /**
   * Get progress for all active goals
   */
  async getAllGoalsProgress(userId: string): Promise<
    Array<{
      goal: StudyGoal;
      currentMinutes: number;
      targetMinutes: number;
      progressPercentage: number;
      periodStart: Date;
      periodEnd: Date;
    }>
  > {
    const activeGoals = await this.getActiveGoals(userId);
    const progressPromises = activeGoals.map((goal) =>
      this.getGoalProgress(goal.id, userId),
    );
    return Promise.all(progressPromises);
  }
}
