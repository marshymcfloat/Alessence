import { Module } from '@nestjs/common';
import { DrillController } from './drill.controller';
import { DrillService } from './drill.service';
import { GeminiModule } from '../gemini/gemini.module';
import { DbModule } from '../db/db.module';

@Module({
  imports: [GeminiModule, DbModule],
  controllers: [DrillController],
  providers: [DrillService],
})
export class DrillModule {}
