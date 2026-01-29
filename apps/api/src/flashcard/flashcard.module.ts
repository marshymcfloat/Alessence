import { Module } from '@nestjs/common';
import { FlashcardController } from './flashcard.controller';
import { FlashcardService } from './flashcard.service';
import { DbModule } from 'src/db/db.module';
import { GeminiModule } from 'src/gemini/gemini.module';

@Module({
  imports: [DbModule, GeminiModule],
  controllers: [FlashcardController],
  providers: [FlashcardService],
  exports: [FlashcardService],
})
export class FlashcardModule {}
