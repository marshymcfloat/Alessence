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
import { ExamHistoryService } from './exam-history.service';
import { AuthGuard } from '@nestjs/passport';
import { FilesInterceptor } from '@nestjs/platform-express';
import { GetUser } from 'src/auth/decorator/get-user.decorator';
import type { AuthenticatedUser } from 'src/auth/decorator/get-user.decorator';
import { CreateExamDto, EvaluateAnswersDto } from '@repo/types/nest';

@Controller('exam')
export class ExamController {
  constructor(
    private readonly examService: ExamService,
    private readonly examHistoryService: ExamHistoryService,
  ) {}

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

  @Post('evaluate-answers')
  @UseGuards(AuthGuard('jwt'))
  evaluateAnswers(@Body() dto: EvaluateAnswersDto) {
    return this.examService.evaluateAnswers(dto.answers);
  }

  @Get(':id/history')
  @UseGuards(AuthGuard('jwt'))
  getExamHistory(
    @Param('id', ParseIntPipe) examId: number,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.examHistoryService.getExamAttemptHistory(examId, user.userId);
  }

  @Get(':id/comparison')
  @UseGuards(AuthGuard('jwt'))
  getExamComparison(
    @Param('id', ParseIntPipe) examId: number,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.examHistoryService.getExamComparisonData(examId, user.userId);
  }

  @Get('attempt/:attemptId')
  @UseGuards(AuthGuard('jwt'))
  getAttemptDetails(
    @Param('attemptId', ParseIntPipe) attemptId: number,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.examHistoryService.getAttemptDetails(attemptId, user.userId);
  }

  @Get(':id/wrong-answers')
  @UseGuards(AuthGuard('jwt'))
  getWrongAnswers(
    @Param('id', ParseIntPipe) examId: number,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.examHistoryService.getWrongAnswers(examId, user.userId);
  }

  @Get(':id/wrong-answers/statistics')
  @UseGuards(AuthGuard('jwt'))
  getWrongAnswerStatistics(
    @Param('id', ParseIntPipe) examId: number,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.examHistoryService.getWrongAnswerStatistics(
      examId,
      user.userId,
    );
  }
}
