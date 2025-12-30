import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/decorator/get-user.decorator';
import type { AuthenticatedUser } from '../auth/decorator/get-user.decorator';

@Controller('progress')
@UseGuards(AuthGuard('jwt'))
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get('stats')
  async getStats(@GetUser() user: AuthenticatedUser) {
    return this.progressService.getUserStats(user.userId);
  }

  @Get('weak-topics')
  async getWeakTopics(@GetUser() user: AuthenticatedUser) {
    return this.progressService.getWeakTopics(user.userId);
  }

  @Get('achievements')
  async getAllAchievements() {
    return this.progressService.getAllAchievements();
  }

  @Post('record-activity')
  async recordActivity(@GetUser() user: AuthenticatedUser) {
    return this.progressService.recordStudyActivity(user.userId);
  }
}
