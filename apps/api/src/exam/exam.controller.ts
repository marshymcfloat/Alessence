import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  ParseIntPipe,
} from '@nestjs/common';
import { ExamService } from './exam.service';
import { AuthGuard } from '@nestjs/passport';
import { FilesInterceptor } from '@nestjs/platform-express';
import { GetUser } from 'src/auth/decorator/get-user.decorator';
import type { AuthenticatedUser } from 'src/auth/decorator/get-user.decorator';
import { CreateExamDto } from '@repo/types/nest';

@Controller('exam')
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FilesInterceptor('newFiles', 10))
  create(
    @Body() createExamDto: CreateExamDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.examService.create(createExamDto, files, user);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  findAll(@Query('subjectId') subjectId?: string) {
    return this.examService.findAll(
      subjectId ? parseInt(subjectId, 10) : undefined,
    );
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.examService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.examService.remove(id);
  }
}
