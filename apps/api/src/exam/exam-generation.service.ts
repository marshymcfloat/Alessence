import { Injectable, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DbService } from 'src/db/db.service';
import { GeminiService, GeneratedQuestion } from 'src/gemini/gemini.service';
import { ExamStatusEnum } from '@repo/db';

import type { Exam, File, Prisma, Question } from '@repo/db';

@Injectable()
export class ExamGenerationService {
  constructor(
    private readonly dbService: DbService,
    private readonly geminiService: GeminiService,
  ) {}

  @OnEvent('exam.created')
  async handleExamCreated(examPayload: Exam) {
    console.log(
      `[RAG] Starting question generation for Exam ID: ${examPayload.id}`,
    );

    try {
      const exam = await this.dbService.exam.findUnique({
        where: { id: examPayload.id },
        include: { sourceFiles: true },
      });

      if (!exam || exam.sourceFiles.length === 0) {
        throw new NotFoundException('Exam or its source files not found.');
      }

      const context = exam.sourceFiles
        .map((file) => file.contentText || '')
        .join('\n\n---\n\n');

      const generatedQuestions = await this.geminiService.generateExamQuestions(
        context,
        exam.description,
        exam.requestedItems,
        exam.questionTypes,
      );

      await this.dbService.question.createMany({
        data: generatedQuestions.map((q: GeneratedQuestion) => ({
          text: q.text,
          type: q.type,
          correctAnswer: q.correctAnswer,
          options: q.options as Prisma.InputJsonValue,
          examId: exam.id,
        })),
      });

      await this.dbService.exam.update({
        where: { id: exam.id },
        data: { status: ExamStatusEnum.READY },
      });

      console.log(
        `[RAG] Successfully generated ${generatedQuestions.length} questions for Exam ID: ${exam.id}`,
      );
    } catch (error) {
      console.error(
        `[RAG] Failed to generate questions for Exam ID: ${examPayload.id}`,
        error,
      );

      await this.dbService.exam.update({
        where: { id: examPayload.id },
        data: { status: ExamStatusEnum.FAILED },
      });
    }
  }
}
