import { Injectable, Logger } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { AchievementCategory } from '@repo/db';

// Achievement definitions - seed these on app startup
const ACHIEVEMENTS: {
  code: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  requirement: number;
  xpReward: number;
}[] = [
  // Streak achievements
  { code: 'STREAK_3', name: 'Getting Started', description: 'Study for 3 days in a row', icon: '🔥', category: 'STREAK', requirement: 3, xpReward: 50 },
  { code: 'STREAK_7', name: 'Week Warrior', description: 'Study for 7 days in a row', icon: '🏆', category: 'STREAK', requirement: 7, xpReward: 100 },
  { code: 'STREAK_14', name: 'Fortnight Focus', description: 'Study for 14 days in a row', icon: '⭐', category: 'STREAK', requirement: 14, xpReward: 200 },
  { code: 'STREAK_30', name: 'Month Master', description: 'Study for 30 days in a row', icon: '👑', category: 'STREAK', requirement: 30, xpReward: 500 },

  // Exam achievements
  { code: 'EXAM_FIRST', name: 'First Steps', description: 'Complete your first exam', icon: '📝', category: 'EXAM', requirement: 1, xpReward: 25 },
  { code: 'EXAM_10', name: 'Exam Explorer', description: 'Complete 10 exams', icon: '📚', category: 'EXAM', requirement: 10, xpReward: 100 },
  { code: 'EXAM_50', name: 'Exam Expert', description: 'Complete 50 exams', icon: '🎓', category: 'EXAM', requirement: 50, xpReward: 300 },
  { code: 'PERFECT_SCORE', name: 'Perfect Score', description: 'Get 100% on an exam', icon: '💯', category: 'EXAM', requirement: 100, xpReward: 150 },

  // Flashcard achievements
  { code: 'FLASH_100', name: 'Card Counter', description: 'Review 100 flashcards', icon: '🃏', category: 'FLASHCARD', requirement: 100, xpReward: 75 },
  { code: 'FLASH_500', name: 'Flashcard Fanatic', description: 'Review 500 flashcards', icon: '🎴', category: 'FLASHCARD', requirement: 500, xpReward: 200 },
  { code: 'DECK_5', name: 'Deck Builder', description: 'Create 5 flashcard decks', icon: '📦', category: 'FLASHCARD', requirement: 5, xpReward: 100 },

  // Study time achievements
  { code: 'STUDY_1H', name: 'Hour of Power', description: 'Study for 1 hour total', icon: '⏱️', category: 'STUDY_TIME', requirement: 60, xpReward: 25 },
  { code: 'STUDY_10H', name: 'Dedicated Learner', description: 'Study for 10 hours total', icon: '📖', category: 'STUDY_TIME', requirement: 600, xpReward: 150 },
  { code: 'STUDY_50H', name: 'Study Scholar', description: 'Study for 50 hours total', icon: '🏅', category: 'STUDY_TIME', requirement: 3000, xpReward: 500 },

  // Social achievements
  { code: 'FRIEND_FIRST', name: 'Social Butterfly', description: 'Add your first friend', icon: '👋', category: 'SOCIAL', requirement: 1, xpReward: 25 },
  { code: 'FRIEND_5', name: 'Study Squad', description: 'Add 5 friends', icon: '👥', category: 'SOCIAL', requirement: 5, xpReward: 75 },
  { code: 'SHARE_FIRST', name: 'Generous Genius', description: 'Share content with a friend', icon: '🎁', category: 'SOCIAL', requirement: 1, xpReward: 50 },
];

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(private readonly dbService: DbService) {}

  /**
   * Seed achievements if they don't exist
   */
  async seedAchievements() {
    for (const achievement of ACHIEVEMENTS) {
      await this.dbService.achievement.upsert({
        where: { code: achievement.code },
        update: {},
        create: achievement,
      });
    }
    this.logger.log('Achievements seeded successfully');
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
   * Get or create user's XP data
   */
  async getOrCreateXP(userId: string) {
    return this.dbService.userXP.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  /**
   * Record a study activity and update streak
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

      const diffDays = Math.floor((today.getTime() - lastStudyDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // Already studied today, no change
        return streak;
      } else if (diffDays === 1) {
        // Consecutive day
        newCurrentStreak = streak.currentStreak + 1;
        newTotalDays = streak.totalStudyDays + 1;
      } else {
        // Streak broken
        newCurrentStreak = 1;
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

    // Check for streak achievements
    await this.checkStreakAchievements(userId, newCurrentStreak);

    return updatedStreak;
  }

  /**
   * Check and award streak-based achievements
   */
  private async checkStreakAchievements(userId: string, currentStreak: number) {
    const streakAchievements = ['STREAK_3', 'STREAK_7', 'STREAK_14', 'STREAK_30'];
    
    for (const code of streakAchievements) {
      const achievement = await this.dbService.achievement.findUnique({
        where: { code },
      });

      if (achievement && currentStreak >= achievement.requirement) {
        await this.awardAchievement(userId, achievement.id, achievement.xpReward);
      }
    }
  }

  /**
   * Award an achievement to a user (if not already awarded)
   */
  async awardAchievement(userId: string, achievementId: number, xpReward: number) {
    try {
      // Check if already has achievement
      const existing = await this.dbService.userAchievement.findUnique({
        where: {
          userId_achievementId: { userId, achievementId },
        },
      });

      if (existing) return null; // Already has it

      // Award achievement
      const userAchievement = await this.dbService.userAchievement.create({
        data: { userId, achievementId },
        include: { achievement: true },
      });

      // Add XP
      if (xpReward > 0) {
        await this.addXP(userId, xpReward);
      }

      this.logger.log(`Awarded achievement ${achievementId} to user ${userId}`);
      return userAchievement;
    } catch (error) {
      // Likely a unique constraint violation - already has achievement
      return null;
    }
  }

  /**
   * Add XP to user and handle level ups
   */
  async addXP(userId: string, amount: number) {
    const userXP = await this.getOrCreateXP(userId);
    const newTotalXP = userXP.totalXp + amount;
    const newLevel = this.calculateLevel(newTotalXP);

    return this.dbService.userXP.update({
      where: { userId },
      data: {
        totalXp: newTotalXP,
        level: newLevel,
      },
    });
  }

  /**
   * Calculate level from XP (simple formula: level = floor(sqrt(xp/100)) + 1)
   */
  private calculateLevel(xp: number): number {
    return Math.floor(Math.sqrt(xp / 100)) + 1;
  }

  /**
   * Get XP required for a level
   */
  getXPForLevel(level: number): number {
    return Math.pow(level - 1, 2) * 100;
  }

  /**
   * Get user's gamification stats
   */
  async getUserStats(userId: string) {
    const [streak, xp, achievements, allAchievements] = await Promise.all([
      this.getOrCreateStreak(userId),
      this.getOrCreateXP(userId),
      this.dbService.userAchievement.findMany({
        where: { userId },
        include: { achievement: true },
        orderBy: { unlockedAt: 'desc' },
      }),
      this.dbService.achievement.findMany({
        orderBy: [{ category: 'asc' }, { requirement: 'asc' }],
      }),
    ]);

    const unlockedIds = new Set(achievements.map(a => a.achievementId));
    const currentLevelXP = this.getXPForLevel(xp.level);
    const nextLevelXP = this.getXPForLevel(xp.level + 1);
    const xpProgress = ((xp.totalXp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;

    return {
      streak: {
        current: streak.currentStreak,
        longest: streak.longestStreak,
        totalDays: streak.totalStudyDays,
        lastStudyDate: streak.lastStudyDate,
      },
      xp: {
        total: xp.totalXp,
        level: xp.level,
        currentLevelXP,
        nextLevelXP,
        progress: Math.min(xpProgress, 100),
      },
      achievements: {
        unlocked: achievements.map(ua => ({
          ...ua.achievement,
          unlockedAt: ua.unlockedAt,
        })),
        locked: allAchievements.filter(a => !unlockedIds.has(a.id)),
        total: allAchievements.length,
        unlockedCount: achievements.length,
      },
    };
  }

  /**
   * Get all achievements (for display)
   */
  async getAllAchievements() {
    return this.dbService.achievement.findMany({
      orderBy: [{ category: 'asc' }, { requirement: 'asc' }],
    });
  }

  /**
   * Check exam-related achievements
   */
  async checkExamAchievements(userId: string, score?: number) {
    // Count completed exams
    const examCount = await this.dbService.examAttempt.count({
      where: {
        userId,
        status: 'COMPLETED',
      },
    });

    // Check exam count achievements
    const examAchievements = [
      { code: 'EXAM_FIRST', count: 1 },
      { code: 'EXAM_10', count: 10 },
      { code: 'EXAM_50', count: 50 },
    ];

    for (const { code, count } of examAchievements) {
      if (examCount >= count) {
        const achievement = await this.dbService.achievement.findUnique({ where: { code } });
        if (achievement) {
          await this.awardAchievement(userId, achievement.id, achievement.xpReward);
        }
      }
    }

    // Check perfect score
    if (score === 100) {
      const achievement = await this.dbService.achievement.findUnique({ where: { code: 'PERFECT_SCORE' } });
      if (achievement) {
        await this.awardAchievement(userId, achievement.id, achievement.xpReward);
      }
    }

    // Award XP for completing exam
    await this.addXP(userId, 10);
  }

  /**
   * Check flashcard-related achievements
   */
  async checkFlashcardAchievements(userId: string) {
    // Count flashcard reviews
    const reviewCount = await this.dbService.flashcardReview.count({
      where: { userId },
    });

    // Count decks created
    const deckCount = await this.dbService.flashcardDeck.count({
      where: { userId },
    });

    const flashAchievements = [
      { code: 'FLASH_100', count: 100, type: 'review' },
      { code: 'FLASH_500', count: 500, type: 'review' },
      { code: 'DECK_5', count: 5, type: 'deck' },
    ];

    for (const { code, count, type } of flashAchievements) {
      const actualCount = type === 'review' ? reviewCount : deckCount;
      if (actualCount >= count) {
        const achievement = await this.dbService.achievement.findUnique({ where: { code } });
        if (achievement) {
          await this.awardAchievement(userId, achievement.id, achievement.xpReward);
        }
      }
    }

    // Award XP for reviewing cards
    await this.addXP(userId, 1);
  }

  /**
   * Check social achievements
   */
  async checkSocialAchievements(userId: string, type: 'friend' | 'share') {
    if (type === 'friend') {
      const friendCount = await this.dbService.friendship.count({
        where: {
          OR: [
            { requesterId: userId, status: 'ACCEPTED' },
            { addresseeId: userId, status: 'ACCEPTED' },
          ],
        },
      });

      const friendAchievements = [
        { code: 'FRIEND_FIRST', count: 1 },
        { code: 'FRIEND_5', count: 5 },
      ];

      for (const { code, count } of friendAchievements) {
        if (friendCount >= count) {
          const achievement = await this.dbService.achievement.findUnique({ where: { code } });
          if (achievement) {
            await this.awardAchievement(userId, achievement.id, achievement.xpReward);
          }
        }
      }
    } else if (type === 'share') {
      const achievement = await this.dbService.achievement.findUnique({ where: { code: 'SHARE_FIRST' } });
      if (achievement) {
        await this.awardAchievement(userId, achievement.id, achievement.xpReward);
      }
    }
  }
}

