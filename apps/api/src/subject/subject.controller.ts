import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SubjectService } from './subject.service';
import { CreateSubjectDTO } from '@repo/types/nest';

@Controller('subject')
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Body() createSubjectDTO: CreateSubjectDTO) {
    return await this.subjectService.create(createSubjectDTO);
  }
}
