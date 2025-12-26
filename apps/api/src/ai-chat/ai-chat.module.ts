import { Module } from '@nestjs/common';
import { AiChatController } from './ai-chat.controller';
import { AiChatService } from './ai-chat.service';
import { DbModule } from 'src/db/db.module';
import { GeminiModule } from 'src/gemini/gemini.module';

@Module({
  imports: [DbModule, GeminiModule],
  controllers: [AiChatController],
  providers: [AiChatService],
  exports: [AiChatService],
})
export class AiChatModule {}

