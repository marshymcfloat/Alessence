import { Module } from '@nestjs/common';
import { LawController } from './law.controller';
import { LawService } from './law.service';
import { DbModule } from 'src/db/db.module';
import { GeminiModule } from 'src/gemini/gemini.module';

@Module({
  imports: [DbModule, GeminiModule],
  controllers: [LawController],
  providers: [LawService],
  exports: [LawService],
})
export class LawModule {}

