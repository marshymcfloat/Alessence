import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateStudySessionDTO, UpdateStudySessionDTO } from '@repo/types/nest';
import { GetUser } from 'src/auth/decorator/get-user.decorator';
import type { AuthenticatedUser } from 'src/auth/decorator/get-user.decorator';
import { StudySessionService } from './study-session.service';
import { StudySession } from '@repo/db';

@Controller('study-session')
export class StudySessionController {
  constructor(private readonly studySessionService: StudySessionService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getAll(
    @GetUser() user: AuthenticatedUser,
  ): Promise<{ sessions: StudySession[]; userId: string }> {
    const sessions = await this.studySessionService.getAll(user.userId);

    return { sessions, userId: user.userId };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('active')
  async getActive(
    @GetUser() user: AuthenticatedUser,
  ): Promise<{ session: StudySession | null; userId: string }> {
    const session = await this.studySessionService.getActiveSession(
      user.userId,
    );

    return { session, userId: user.userId };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async getById(
    @Param('id') id: number,
    @GetUser() user: AuthenticatedUser,
  ): Promise<{ session: StudySession; userId: string }> {
    const session = await this.studySessionService.getById(+id, user.userId);

    return { session, userId: user.userId };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(
    @Body() createSessionDto: CreateStudySessionDTO,
    @GetUser() user: AuthenticatedUser,
  ): Promise<{ session: StudySession; userId: string }> {
    const session = await this.studySessionService.create(
      createSessionDto,
      user.userId,
    );

    return { session, userId: user.userId };
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() updateSessionDto: UpdateStudySessionDTO,
    @GetUser() user: AuthenticatedUser,
  ): Promise<{ session: StudySession; userId: string }> {
    const session = await this.studySessionService.update(
      +id,
      updateSessionDto,
      user.userId,
    );

    return { session, userId: user.userId };
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async delete(
    @Param('id') id: number,
    @GetUser() user: AuthenticatedUser,
  ): Promise<{ success: boolean }> {
    await this.studySessionService.delete(+id, user.userId);
    return { success: true };
  }
}
