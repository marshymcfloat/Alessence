import { Module } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { MockExamGeminiService } from './mock-exam.service';

@Module({
  providers: [GeminiService, MockExamGeminiService],
  exports: [GeminiService, MockExamGeminiService],
})
export class GeminiModule {}
