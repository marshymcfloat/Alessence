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
import { CreateSubjectDTO } from '@repo/types/nest';
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
    const newSubject = await this.subjectService.create(createSubjectDTO);

    const userId = user.userId;
    return { newSubject, userId };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getAll(
    @GetUser() user: AuthenticatedUser,
  ): Promise<GetAllSubjectReturnType> {
    const subjects = await this.subjectService.getAll();

    return { subjects, userId: user.userId };
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @GetUser() user: AuthenticatedUser,
  ): Promise<{ message: string; userId: string }> {
    await this.subjectService.delete(parseInt(id));
    return {
      message: 'Subject deleted successfully',
      userId: String(user.userId),
    };
  }
}
