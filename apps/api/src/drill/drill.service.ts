import { Injectable } from '@nestjs/common';
import { GeminiService } from '../gemini/gemini.service';
import { DbService } from '../db/db.service';
import { GenerateDrillDto, GenerateAuditDrillDto } from './drill.controller';

@Injectable()
export class DrillService {
  constructor(
    private readonly geminiService: GeminiService,
    private readonly dbService: DbService,
  ) {}

  async generateMathDrill(dto: GenerateDrillDto, userId: string) {
    const context = dto.context || '';

    return this.geminiService.generateMathProblem(
      dto.topic,
      context,
      dto.difficulty,
    );
  }

  /**
   * Generate a step-by-step audit/computation problem with detailed trace
   * This mimics a professor's whiteboard solution
   */
  async generateAuditDrill(dto: GenerateAuditDrillDto, userId: string) {
    let context = dto.context || '';

    // If subjectId is provided, get subject context
    if (dto.subjectId) {
      const subject = await this.dbService.subject.findFirst({
        where: { id: dto.subjectId },
        select: { title: true, description: true },
      });
      if (subject) {
        context += `\nSubject: ${subject.title}${subject.description ? ` - ${subject.description}` : ''}`;
      }
    }

    return this.geminiService.generateAuditProblem(
      dto.topic,
      context,
      dto.difficulty,
    );
  }
}

