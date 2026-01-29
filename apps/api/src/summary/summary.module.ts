import { Module } from '@nestjs/common';
import { SummaryService } from './summary.service';
import { SummaryController } from './summary.controller';
import { DbModule } from 'src/db/db.module';
import { FileModule } from 'src/file/file.module';
import { GeminiModule } from 'src/gemini/gemini.module';

@Module({
  imports: [FileModule, DbModule, GeminiModule],
  controllers: [SummaryController],
  providers: [SummaryService],
})
export class SummaryModule {}
