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
import { StandardExamService } from './standard-exam.service';
import { MockExamService } from './mock-exam.service';
import { ExamHistoryService } from './exam-history.service';
import { ExamAttemptService } from './exam-attempt.service';
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
    private readonly examAttemptService: ExamAttemptService,
    private readonly standardExamService: StandardExamService,
    private readonly mockExamService: MockExamService,
  ) {}

  @Post('mock')
  @UseGuards(AuthGuard('jwt'))
  createMockExam(
    @Body('subjectId', ParseIntPipe) subjectId: number,
    @Body('title') title: string | undefined, // Optional title
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.mockExamService.createMockExam(user.userId, subjectId, title);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FilesInterceptor('newFiles', 10))
  create(
    @Body() createExamDto: CreateExamDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.standardExamService.create(createExamDto, files, user);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  findAll(
    @Query('subjectId') subjectId?: string,
    @GetUser() user?: AuthenticatedUser,
  ) {
    if (!user) {
      throw new Error('User not authenticated');
    }
    return this.examService.findAll(
      user.userId,
      subjectId ? parseInt(subjectId, 10) : undefined,
    );
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.examService.findOne(id, user.userId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.examService.remove(id, user.userId);
  }

  @Post('evaluate-answers')
  @UseGuards(AuthGuard('jwt'))
  evaluateAnswers(@Body() dto: EvaluateAnswersDto) {
    return this.examService.evaluateAnswers(dto.answers);
  }

  @Post(':id/start-attempt')
  @UseGuards(AuthGuard('jwt'))
  startAttempt(
    @Param('id', ParseIntPipe) examId: number,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.examAttemptService.startAttempt(examId, user.userId);
  }

  @Post(':id/submit-attempt')
  @UseGuards(AuthGuard('jwt'))
  submitAttempt(
    @Param('id', ParseIntPipe) examId: number,
    @Body()
    body: {
      attemptId: number;
      answers: Array<{ questionId: number; userAnswer: string }>;
    },
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.examAttemptService.submitAttempt(
      examId,
      body.attemptId,
      user.userId,
      body.answers,
    );
  }

  @Post('attempt/:attemptId/abandon')
  @UseGuards(AuthGuard('jwt'))
  abandonAttempt(
    @Param('attemptId', ParseIntPipe) attemptId: number,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.examAttemptService.abandonAttempt(attemptId, user.userId);
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
