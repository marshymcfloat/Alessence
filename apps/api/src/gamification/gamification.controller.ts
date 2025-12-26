import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GamificationService } from './gamification.service';
import { GetUser } from 'src/auth/decorator/get-user.decorator';
import type { AuthenticatedUser } from 'src/auth/decorator/get-user.decorator';

@Controller('gamification')
@UseGuards(AuthGuard('jwt'))
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  /**
   * Get user's gamification stats (streak, XP, achievements)
   */
  @Get('stats')
  async getUserStats(@GetUser() user: AuthenticatedUser) {
    return this.gamificationService.getUserStats(user.userId);
  }

  /**
   * Get all achievements
   */
  @Get('achievements')
  async getAllAchievements() {
    return this.gamificationService.getAllAchievements();
  }

  /**
   * Record study activity (call this when user starts a study session)
   */
  @Post('record-activity')
  async recordActivity(@GetUser() user: AuthenticatedUser) {
    return this.gamificationService.recordStudyActivity(user.userId);
  }
}

