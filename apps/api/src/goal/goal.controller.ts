import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GoalService } from './goal.service';
import { CreateGoalDTO, UpdateGoalDTO } from '@repo/types/nest';
import { GetUser } from 'src/auth/decorator/get-user.decorator';
import type { AuthenticatedUser } from 'src/auth/decorator/get-user.decorator';
import { StudyGoal } from '@repo/db';

@Controller('goal')
export class GoalController {
  constructor(private readonly goalService: GoalService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getAll(
    @GetUser() user: AuthenticatedUser,
  ): Promise<{ goals: StudyGoal[]; userId: string }> {
    const goals = await this.goalService.getAll(user.userId);
    return { goals, userId: user.userId };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('active')
  async getActiveGoals(
    @GetUser() user: AuthenticatedUser,
  ): Promise<{ goals: StudyGoal[]; userId: string }> {
    const goals = await this.goalService.getActiveGoals(user.userId);
    return { goals, userId: user.userId };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('progress')
  async getAllGoalsProgress(@GetUser() user: AuthenticatedUser) {
    const progress = await this.goalService.getAllGoalsProgress(user.userId);
    return { progress, userId: user.userId };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async getById(
    @Param('id') id: string,
    @GetUser() user: AuthenticatedUser,
  ): Promise<{ goal: StudyGoal; userId: string }> {
    const goal = await this.goalService.getById(+id, user.userId);
    return { goal, userId: user.userId };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/progress')
  async getGoalProgress(
    @Param('id') id: string,
    @GetUser() user: AuthenticatedUser,
  ) {
    const progress = await this.goalService.getGoalProgress(+id, user.userId);
    return { progress, userId: user.userId };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(
    @Body() createGoalDto: CreateGoalDTO,
    @GetUser() user: AuthenticatedUser,
  ): Promise<{ goal: StudyGoal; userId: string }> {
    const goal = await this.goalService.create(createGoalDto, user.userId);
    return { goal, userId: user.userId };
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateGoalDto: UpdateGoalDTO,
    @GetUser() user: AuthenticatedUser,
  ): Promise<{ goal: StudyGoal; userId: string }> {
    const goal = await this.goalService.update(+id, updateGoalDto, user.userId);
    return { goal, userId: user.userId };
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @GetUser() user: AuthenticatedUser,
  ): Promise<{ success: boolean }> {
    await this.goalService.delete(+id, user.userId);
    return { success: true };
  }
}
