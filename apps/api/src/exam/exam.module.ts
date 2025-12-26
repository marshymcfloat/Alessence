import { Module } from '@nestjs/common';
import { ExamService } from './exam.service';
import { ExamHistoryService } from './exam-history.service';
import { ExamAttemptService } from './exam-attempt.service';
import { ExamController } from './exam.controller';
import { DbModule } from 'src/db/db.module';
import { FileModule } from 'src/file/file.module';
import { GeminiModule } from 'src/gemini/gemini.module';

@Module({
  imports: [FileModule, DbModule, GeminiModule],
  controllers: [ExamController],
  providers: [ExamService, ExamHistoryService, ExamAttemptService],
})
export class ExamModule {}
