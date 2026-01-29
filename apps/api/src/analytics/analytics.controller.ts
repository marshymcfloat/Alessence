import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/decorator/get-user.decorator';
import type { AuthenticatedUser } from 'src/auth/decorator/get-user.decorator';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('exam-score-trends')
  async getExamScoreTrends(
    @Query('days') days: string,
    @GetUser() user: AuthenticatedUser,
  ) {
    const daysNum = days ? parseInt(days, 10) : 30;
    const trends = await this.analyticsService.getExamScoreTrends(
      user.userId,
      daysNum,
    );
    return { trends, userId: user.userId };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('subject-performance')
  async getSubjectPerformance(@GetUser() user: AuthenticatedUser) {
    const performance = await this.analyticsService.getSubjectPerformance(
      user.userId,
    );
    return { performance, userId: user.userId };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('study-time')
  async getStudyTime(
    @Query('days') days: string,
    @GetUser() user: AuthenticatedUser,
  ) {
    const daysNum = days ? parseInt(days, 10) : 30;
    const data = await this.analyticsService.getStudyTimeAnalytics(
      user.userId,
      daysNum,
    );
    return { data, userId: user.userId };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('task-completion')
  async getTaskCompletion(
    @Query('days') days: string,
    @GetUser() user: AuthenticatedUser,
  ) {
    const daysNum = days ? parseInt(days, 10) : 30;
    const data = await this.analyticsService.getTaskCompletionRates(
      user.userId,
      daysNum,
    );
    return { data, userId: user.userId };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('weak-areas')
  async getWeakAreas(@GetUser() user: AuthenticatedUser) {
    const weakAreas = await this.analyticsService.getWeakAreas(user.userId);
    return { weakAreas, userId: user.userId };
  }
}
