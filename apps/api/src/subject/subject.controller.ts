import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SubjectService } from './subject.service';
import { CreateSubjectDTO, CreateTopicDTO } from '@repo/types/nest';
import { GetUser } from 'src/auth/decorator/get-user.decorator';
import type { AuthenticatedUser } from 'src/auth/decorator/get-user.decorator';
import {
  CreateNewSubjectReturnType,
  GetAllSubjectReturnType,
} from '@repo/types';

@Controller('subject')
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(
    @Body() createSubjectDTO: CreateSubjectDTO,
    @GetUser() user: AuthenticatedUser,
  ): Promise<CreateNewSubjectReturnType> {
    const newSubject = await this.subjectService.create(createSubjectDTO, user.userId);

    const userId = user.userId;
    return { newSubject, userId };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getAll(
    @GetUser() user: AuthenticatedUser,
  ): Promise<GetAllSubjectReturnType> {
    const subjects = await this.subjectService.getAll(user.userId);

    return { subjects, userId: user.userId };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('system-syllabus')
  async getSystemSyllabus() {
    return this.subjectService.getSystemSyllabus();
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/fork')
  async forkSubject(
    @Param('id') id: string,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.subjectService.forkSubject(parseInt(id), user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @GetUser() user: AuthenticatedUser,
  ): Promise<{ message: string; userId: string }> {
    await this.subjectService.delete(parseInt(id), user.userId);
    return {
      message: 'Subject deleted successfully',
      userId: String(user.userId),
    };
  }

  // --- Topic Endpoints ---

  @UseGuards(AuthGuard('jwt'))
  @Post('topic')
  async createTopic(@Body() dto: CreateTopicDTO) {
    return this.subjectService.createTopic(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('topic/generate')
  async generateSubTopics(@Body('parentTopicId') parentTopicId: number) {
    return this.subjectService.generateSubTopics(parentTopicId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/topics')
  async getTopics(@Param('id') id: string) {
    return this.subjectService.getTopics(parseInt(id));
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('topic/:id')
  async deleteTopic(@Param('id') id: string) {
    return this.subjectService.deleteTopic(parseInt(id));
  }
}
