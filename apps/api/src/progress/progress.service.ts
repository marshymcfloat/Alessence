import { Injectable, Logger } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { AchievementCategory } from '@repo/db';

// Professional Milestones & Competency Markers
const ACHIEVEMENTS: {
  code: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  requirement: number;
  xpReward: number;
}[] = [
  // Discipline (Streaks) - Rebranded from "Streak" to "Discipline"
  {
    code: 'DISCIPLINE_3',
    name: 'Momentum Builder',
    description: 'Study for 3 days in a row',
    icon: '⚡',
    category: 'STREAK',
    requirement: 3,
    xpReward: 50,
  },
  {
    code: 'DISCIPLINE_7',
    name: 'Weekly Grind',
    description: 'Study for 7 days in a row',
    icon: '📅',
    category: 'STREAK',
    requirement: 7,
    xpReward: 150,
  },
  {
    code: 'DISCIPLINE_30',
    name: 'Iron Discipline',
    description: 'Study for 30 days in a row',
    icon: '🛡️',
    category: 'STREAK',
    requirement: 30,
    xpReward: 1000,
  },

  // Exam Performance (Competency)
  {
    code: 'COMPETENCE_FIRST',
    name: 'First Step',
    description: 'Complete your first practice assessment',
    icon: '📝',
    category: 'EXAM',
    requirement: 1,
    xpReward: 25,
  },
  {
    code: 'COMPETENCE_10',
    name: 'Diligent Practitioner',
    description: 'Complete 10 practice assessments',
    icon: '📚',
    category: 'EXAM',
    requirement: 10,
    xpReward: 100,
  },
  {
    code: 'MASTERY_PERFECT',
    name: 'Precision',
    description: 'Achieve 100% on a comprehensive exam',
    icon: '🎯',
    category: 'EXAM',
    requirement: 100,
    xpReward: 200,
  },

  // Flashcards (Retention)
  {
    code: 'RETENTION_100',
    name: 'Memory Builder',
    description: 'Review 100 concepts',
    icon: '🧠',
    category: 'FLASHCARD',
    requirement: 100,
    xpReward: 75,
  },
  {
    code: 'RETENTION_500',
    name: 'Knowledge Bank',
    description: 'Review 500 concepts',
    icon: '💾',
    category: 'FLASHCARD',
    requirement: 500,
    xpReward: 300,
  },

  // Study Time (Deep Work)
  {
    code: 'FOCUS_10H',
    name: 'Deep Work: Novice',
    description: 'Complete 10 hours of focused study',
    icon: '🕐',
    category: 'STUDY_TIME',
    requirement: 600,
    xpReward: 150,
  },
  {
    code: 'FOCUS_50H',
    name: 'Deep Work: Pro',
    description: 'Complete 50 hours of focused study',
    icon: '🕔',
    category: 'STUDY_TIME',
    requirement: 3000,
    xpReward: 1000,
  },
];

@Injectable()
export class ProgressService {
  private readonly logger = new Logger(ProgressService.name);

  constructor(private readonly dbService: DbService) {}

  /**
   * Seed achievements/badges if they don't exist
   */
  async seedAchievements() {
    for (const achievement of ACHIEVEMENTS) {
      await this.dbService.achievement.upsert({
        where: { code: achievement.code },
        update: {
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
        },
        create: achievement,
      });
    }
    this.logger.log('Professional Milestones seeded successfully');
  }

  /**
   * Get or create user's streak data
   */
  async getOrCreateStreak(userId: string) {
    return this.dbService.studyStreak.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  /**
   * Get or create user's Progress Profile (formerly XP)
   */
  async getOrCreateProfile(userId: string) {
    return this.dbService.userXP.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  /**
   * Record a study activity and update Discipline Streak
   */
  async recordStudyActivity(userId: string) {
    const streak = await this.getOrCreateStreak(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastStudy = streak.lastStudyDate;
    let newCurrentStreak = streak.currentStreak;
    let newTotalDays = streak.totalStudyDays;

    if (!lastStudy) {
      // First time studying
      newCurrentStreak = 1;
      newTotalDays = 1;
    } else {
      const lastStudyDate = new Date(lastStudy);
      lastStudyDate.setHours(0, 0, 0, 0);

      const diffDays = Math.floor(
        (today.getTime() - lastStudyDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffDays === 0) {
        return streak; // Already recorded today
      } else if (diffDays === 1) {
        newCurrentStreak = streak.currentStreak + 1;
        newTotalDays = streak.totalStudyDays + 1;
      } else {
        newCurrentStreak = 1; // Broken streak
        newTotalDays = streak.totalStudyDays + 1;
      }
    }

    const newLongestStreak = Math.max(streak.longestStreak, newCurrentStreak);

    const updatedStreak = await this.dbService.studyStreak.update({
      where: { userId },
      data: {
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        lastStudyDate: today,
        totalStudyDays: newTotalDays,
      },
    });

    await this.checkStreakAchievements(userId, newCurrentStreak);
    return updatedStreak;
  }

  /**
   * Update Subject Mastery based on exam score
   * Uses Exponential Moving Average (EMA) to favor recent performance
   */
  async updateSubjectMastery(
    userId: string,
    subjectId: number,
    examScore: number,
  ) {
    const mastery = await this.dbService.subjectMastery.findUnique({
      where: { userId_subjectId: { userId, subjectId } },
    });

    let newScore = examScore;
    if (mastery) {
      // EMA with alpha = 0.2 (20% weight to new score, 80% to history)
      // This makes mastery stable but responsive
      newScore = mastery.masteryScore * 0.8 + examScore * 0.2;
    }

    await this.dbService.subjectMastery.upsert({
      where: { userId_subjectId: { userId, subjectId } },
      create: {
        userId,
        subjectId,
        masteryScore: newScore,
        lastActivity: new Date(),
      },
      update: {
        masteryScore: newScore,
        lastActivity: new Date(),
      },
    });

    // Award competence points (XP) based on performance
    // Base 10 points + 1 point for every 10% score
    const xpReward = 10 + Math.floor(examScore / 10);
    await this.addProgress(userId, xpReward);
  }

  /**
   * Update Topic Mastery (Spaced Repetition)
   * Uses simple specific strength update. Later can be SM-2.
   */
  async updateTopicMastery(
    userId: string,
    topicId: number,
    isCorrect: boolean,
  ) {
    const mastery = await this.dbService.topicMastery.findUnique({
      where: { userId_topicId: { userId, topicId } },
    });

    let newStrength = mastery ? mastery.strength : 0;
    // Simple logic: +10 if correct, -20 if wrong (penalize mistakes more to force review)
    // Clamped between 0 and 100
    if (isCorrect) {
      newStrength = Math.min(100, newStrength + 10);
    } else {
      newStrength = Math.max(0, newStrength - 20);
    }

    // Schedule next review
    // If strength is low, review soon. If high, review later.
    // 0-20: 1 day
    // 21-50: 3 days
    // 51-80: 7 days
    // 81-100: 14 days
    let daysToAdd = 1;
    if (newStrength > 80) daysToAdd = 14;
    else if (newStrength > 50) daysToAdd = 7;
    else if (newStrength > 20) daysToAdd = 3;

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + daysToAdd);

    await this.dbService.topicMastery.upsert({
      where: { userId_topicId: { userId, topicId } },
      create: {
        userId,
        topicId,
        strength: newStrength,
        nextReviewAt: nextReview,
        lastReviewedAt: new Date(),
      },
      update: {
        strength: newStrength,
        nextReviewAt: nextReview,
        lastReviewedAt: new Date(),
      },
    });
  }

  /**
   * Get weak topics for spaced repetition
   * Criteria: Strength < 60 OR Due for review
   */
  async getWeakTopics(userId: string) {
    const now = new Date();

    const weakTopics = await this.dbService.topicMastery.findMany({
      where: {
        userId,
        OR: [
          { strength: { lt: 60 } }, // Low mastery
          { nextReviewAt: { lte: now } }, // Due for review
        ],
      },
      include: {
        topic: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: [
        { nextReviewAt: 'asc' }, // Overdue first
        { strength: 'asc' }, // Lowest strength next
      ],
      take: 10, // Limit to top 10 weaknesses to avoid overwhelming
    });

    return weakTopics.map((wt) => ({
      topicId: wt.topicId,
      title: wt.topic.title,
      subjectId: wt.topic.subjectId,
      subject: wt.topic.subject.title,
      strength: wt.strength,
      nextReviewAt: wt.nextReviewAt,
      reason:
        wt.nextReviewAt && wt.nextReviewAt <= now
          ? 'Due for Review'
          : 'Low Mastery',
    }));
  }

  private async checkStreakAchievements(userId: string, currentStreak: number) {
    const streakAchievements = [
      'DISCIPLINE_3',
      'DISCIPLINE_7',
      'DISCIPLINE_30',
    ];

    for (const code of streakAchievements) {
      const achievement = await this.dbService.achievement.findUnique({
        where: { code },
      });
      if (achievement && currentStreak >= achievement.requirement) {
        await this.awardBadge(userId, achievement.id, achievement.xpReward);
      }
    }
  }

  async awardBadge(userId: string, achievementId: number, xpReward: number) {
    try {
      const existing = await this.dbService.userAchievement.findUnique({
        where: { userId_achievementId: { userId, achievementId } },
      });

      if (existing) return null;

      const userAchievement = await this.dbService.userAchievement.create({
        data: { userId, achievementId },
        include: { achievement: true },
      });

      if (xpReward > 0) {
        await this.addProgress(userId, xpReward);
      }

      this.logger.log(`Awarded badge ${achievementId} to user ${userId}`);
      return userAchievement;
    } catch (error) {
      return null;
    }
  }

  /**
   * Add Competence Points (XP) and update Rank
   */
  async addProgress(userId: string, amount: number) {
    const profile = await this.getOrCreateProfile(userId);
    const newTotalXP = profile.totalXp + amount;

    // Calculate new Rank
    const { rank, level } = this.calculateRankAndLevel(newTotalXP);

    return this.dbService.userXP.update({
      where: { userId },
      data: {
        totalXp: newTotalXP,
        level: level,
        currentRank: rank,
      },
    });
  }

  /**
   * Calculate Rank based on Competence Points
   */
  private calculateRankAndLevel(xp: number): { rank: string; level: number } {
    // Level formula: level = floor(sqrt(xp/100)) + 1
    // Keeping level for backward compatibility or fine-grained progress
    const level = Math.floor(Math.sqrt(xp / 100)) + 1;

    // Professional Ranks
    let rank = 'Undergraduate';
    if (xp >= 50000) rank = 'Practitioner';
    else if (xp >= 20000) rank = 'Candidate';
    else if (xp >= 5000) rank = 'Reviewee';

    return { rank, level };
  }

  /**
   * Get points required for next level
   */
  getPointsForLevel(level: number): number {
    return Math.pow(level - 1, 2) * 100;
  }

  /**
   * Get user's professional profile stats
   */
  async getUserStats(userId: string) {
    const [streak, profile, achievements, allAchievements, mastery] =
      await Promise.all([
        this.getOrCreateStreak(userId),
        this.getOrCreateProfile(userId),
        this.dbService.userAchievement.findMany({
          where: { userId },
          include: { achievement: true },
          orderBy: { unlockedAt: 'desc' },
        }),
        this.dbService.achievement.findMany({
          orderBy: [{ category: 'asc' }, { requirement: 'asc' }],
        }),
        this.dbService.subjectMastery.findMany({
          where: { userId },
          include: { subject: true },
          orderBy: { masteryScore: 'desc' },
        }),
      ]);

    // Fetch daily activity for heatmap (last 365 days)
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);

    // Aggregate activity from different sources
    // 1. Exam attempts
    const examActivity = await this.dbService.examAttempt.findMany({
      where: {
        userId,
        startedAt: { gte: oneYearAgo },
      },
      select: { startedAt: true },
    });

    // 2. Completed tasks
    const taskActivity = await this.dbService.task.findMany({
      where: {
        userId,
        status: 'DONE',
        updatedAt: { gte: oneYearAgo },
      },
      select: { updatedAt: true },
    });

    // 3. Study sessions
    const sessionActivity = await this.dbService.studySession.findMany({
      where: {
        userId,
        startedAt: { gte: oneYearAgo },
      },
      select: { startedAt: true },
    });

    // Combine and count by date
    const activityMap = new Map<string, number>();
    const addToMap = (date: Date) => {
      const dateStr = date.toISOString().split('T')[0] as string;
      activityMap.set(dateStr, (activityMap.get(dateStr) ?? 0) + 1);
    };

    examActivity.forEach((a) => addToMap(a.startedAt));
    taskActivity.forEach((a) => addToMap(a.updatedAt));
    sessionActivity.forEach((a) => addToMap(a.startedAt));

    const heatmapData = Array.from(activityMap.entries()).map(
      ([date, count]) => ({
        date,
        count,
      }),
    );

    const unlockedIds = new Set(achievements.map((a) => a.achievementId));
    // Determine next rank threshold
    let nextRankPoints = 5000;
    if (profile.totalXp >= 20000)
      nextRankPoints = 50000; // Next: Practitioner (if there's a higher one) or Max
    else if (profile.totalXp >= 5000) nextRankPoints = 20000; // Next: Candidate

    const currentRankFloor =
      profile.totalXp >= 20000 ? 20000 : profile.totalXp >= 5000 ? 5000 : 0;

    const progressPercent = Math.min(
      100,
      Math.max(
        0,
        ((profile.totalXp - currentRankFloor) /
          (nextRankPoints - currentRankFloor)) *
          100,
      ),
    );

    const badgesData = {
      unlocked: achievements.map((ua) => ({
        ...ua.achievement,
        unlockedAt: ua.unlockedAt,
      })),
      locked: allAchievements.filter((a) => !unlockedIds.has(a.id)),
      total: allAchievements.length,
      unlockedCount: achievements.length,
    };

    return {
      streak: {
        current: streak.currentStreak,
        longest: streak.longestStreak,
        lastActivity: streak.lastStudyDate,
        totalDays: streak.totalStudyDays,
        lastStudyDate: streak.lastStudyDate, // Compat
      },
      profile: {
        totalPoints: profile.totalXp,
        level: profile.level,
        rank: profile.currentRank,
        nextRank: this.getNextRank(profile.currentRank),
        progress: progressPercent,
        nextRankPoints,
      },
      mastery: mastery.map((m) => ({
        subject: m.subject.title,
        score: m.masteryScore,
        lastActivity: m.lastActivity,
      })),
      badges: badgesData,
      heatmap: heatmapData,
      // Backward Compatibility
      xp: {
        total: profile.totalXp,
        level: profile.level,
        currentLevelXP: currentRankFloor,
        nextLevelXP: nextRankPoints,
        progress: progressPercent,
      },
      achievements: badgesData,
    };
  }

  private getNextRank(currentRank: string): string {
    switch (currentRank) {
      case 'Undergraduate':
        return 'Reviewee';
      case 'Reviewee':
        return 'Candidate';
      case 'Candidate':
        return 'Practitioner';
      default:
        return 'Max Rank';
    }
  }

  async getAllAchievements() {
    return this.dbService.achievement.findMany({
      orderBy: [{ category: 'asc' }, { requirement: 'asc' }],
    });
  }

  // Legacy method stubs or updated helpers for other events
  async checkExamAchievements(userId: string, score: number) {
    // Check total exams
    const examCount = await this.dbService.examAttempt.count({
      where: { userId, status: 'COMPLETED' },
    });

    const examAchievements = [
      { code: 'COMPETENCE_FIRST', count: 1 },
      { code: 'COMPETENCE_10', count: 10 },
    ];

    for (const { code, count } of examAchievements) {
      if (examCount >= count) {
        const achievement = await this.dbService.achievement.findUnique({
          where: { code },
        });
        if (achievement)
          await this.awardBadge(userId, achievement.id, achievement.xpReward);
      }
    }

    if (score === 100) {
      const achievement = await this.dbService.achievement.findUnique({
        where: { code: 'MASTERY_PERFECT' },
      });
      if (achievement)
        await this.awardBadge(userId, achievement.id, achievement.xpReward);
    }
  }
}
