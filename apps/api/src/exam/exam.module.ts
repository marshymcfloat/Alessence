import { Module } from '@nestjs/common';
import { ExamService } from './exam.service';
import { ExamController } from './exam.controller';
import { DbModule } from 'src/db/db.module';
import { FileModule } from 'src/file/file.module';
import { GeminiModule } from 'src/gemini/gemini.module';

@Module({
  imports: [FileModule, DbModule, GeminiModule],
  controllers: [ExamController],
  providers: [ExamService],
})
export class ExamModule {}
