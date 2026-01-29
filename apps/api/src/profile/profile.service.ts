import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DbService } from '../db/db.service';
import { put } from '@vercel/blob';
import type { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly dbService: DbService) {}

  /**
   * Get user profile by ID
   */
  async getProfile(userId: string) {
    const user = await this.dbService.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        profilePicture: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            exams: true,
            flashcardDecks: true,
            notes: true,
            studySessions: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get gamification stats
    const [streak, xp, achievements] = await Promise.all([
      this.dbService.studyStreak.findUnique({ where: { userId } }),
      this.dbService.userXP.findUnique({ where: { userId } }),
      this.dbService.userAchievement.findMany({
        where: { userId },
        include: { achievement: true },
        orderBy: { unlockedAt: 'desc' },
        take: 5, // Recent achievements
      }),
    ]);

    // Calculate XP progress for display
    const calculateLevel = (totalXp: number) =>
      Math.floor(Math.sqrt(totalXp / 100)) + 1;
    const getXPForLevel = (level: number) => Math.pow(level - 1, 2) * 100;

    const currentLevel = xp?.level || 1;
    const totalXpValue = xp?.totalXp || 0;
    const currentLevelXP = getXPForLevel(currentLevel);
    const nextLevelXP = getXPForLevel(currentLevel + 1);
    const xpProgress =
      ((totalXpValue - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;

    return {
      ...user,
      stats: {
        exams: user._count.exams,
        flashcardDecks: user._count.flashcardDecks,
        notes: user._count.notes,
        studySessions: user._count.studySessions,
      },
      gamification: {
        streak: streak?.currentStreak || 0,
        longestStreak: streak?.longestStreak || 0,
        totalStudyDays: streak?.totalStudyDays || 0,
        level: currentLevel,
        totalXp: totalXpValue,
        xpProgress: Math.min(xpProgress, 100),
        recentAchievements: achievements.map((ua) => ({
          ...ua.achievement,
          unlockedAt: ua.unlockedAt,
        })),
      },
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.dbService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.dbService.user.update({
      where: { id: userId },
      data: {
        name: dto.name !== undefined ? dto.name : user.name,
        bio: dto.bio !== undefined ? dto.bio : user.bio,
      },
      select: {
        id: true,
        name: true,
        email: true,
        profilePicture: true,
        bio: true,
      },
    });

    return updated;
  }

  /**
   * Upload profile picture
   */
  async uploadProfilePicture(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.',
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File too large. Maximum size is 5MB.');
    }

    try {
      // Upload to Vercel Blob
      const blob = await put(
        `profile-pictures/${userId}-${Date.now()}.${file.originalname.split('.').pop()}`,
        file.buffer,
        {
          access: 'public',
          contentType: file.mimetype,
        },
      );

      // Update user profile picture URL
      const updated = await this.dbService.user.update({
        where: { id: userId },
        data: { profilePicture: blob.url },
        select: {
          id: true,
          name: true,
          email: true,
          profilePicture: true,
          bio: true,
        },
      });

      return updated;
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      throw new BadRequestException('Failed to upload profile picture');
    }
  }

  /**
   * Remove profile picture
   */
  async removeProfilePicture(userId: string) {
    const updated = await this.dbService.user.update({
      where: { id: userId },
      data: { profilePicture: null },
      select: {
        id: true,
        name: true,
        email: true,
        profilePicture: true,
        bio: true,
      },
    });

    return updated;
  }

  /**
   * Get public profile (for viewing other users)
   */
  async getPublicProfile(userId: string, viewerId: string) {
    const user = await this.dbService.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        profilePicture: true,
        bio: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if they are friends
    const friendship = await this.dbService.friendship.findFirst({
      where: {
        OR: [
          { requesterId: viewerId, addresseeId: userId, status: 'ACCEPTED' },
          { requesterId: userId, addresseeId: viewerId, status: 'ACCEPTED' },
        ],
      },
    });

    // Get public stats
    const [streak, xp, achievementCount] = await Promise.all([
      this.dbService.studyStreak.findUnique({ where: { userId } }),
      this.dbService.userXP.findUnique({ where: { userId } }),
      this.dbService.userAchievement.count({ where: { userId } }),
    ]);

    return {
      ...user,
      isFriend: !!friendship,
      gamification: {
        streak: streak?.currentStreak || 0,
        level: xp?.level || 1,
        achievementCount,
      },
    };
  }
}
