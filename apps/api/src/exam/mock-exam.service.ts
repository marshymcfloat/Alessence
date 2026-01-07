import { Injectable, Logger } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { ExamStatusEnum, QuestionTypeEnum } from '@repo/db';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Exam } from '@repo/db';

@Injectable()
export class MockExamService {
  private readonly logger = new Logger(MockExamService.name);

  constructor(
    private readonly dbService: DbService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createMockExam(
    userId: string,
    subjectId: number,
    title?: string,
  ): Promise<Exam> {
    // 1. Fetch all files for this subject that the user has access to
    const files = await this.dbService.file.findMany({
      where: {
        userId,
        subjectId,
      },
    });

    if (files.length === 0) {
      this.logger.warn(
        `No source files found for Subject ID: ${subjectId}. Generating mock exam using internal knowledge.`,
      );
    }

    // 2. Create the exam record
    const subject = await this.dbService.subject.findUnique({
      where: { id: subjectId },
      select: { title: true },
    });

    const subjectTitle = subject?.title || 'Subject';
    let description = title;

    if (!description) {
      const baseTitle = `Mock Exam - ${subjectTitle}`;
      const existingExams = await this.dbService.exam.findMany({
        where: {
          userId,
          description: {
            startsWith: baseTitle,
          },
        },
        select: { description: true },
      });

      if (existingExams.length === 0) {
        description = baseTitle;
      } else {
        const regex = new RegExp(
          `^${baseTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\((\\d+)\\)$`,
        );
        let maxNum = 0;
        let hasExactBase = false;

        for (const exam of existingExams) {
          if (exam.description === baseTitle) {
            hasExactBase = true;
          } else {
            const match = exam.description.match(regex);
            if (match && match[1]) {
              const num = parseInt(match[1], 10);
              if (num > maxNum) maxNum = num;
            }
          }
        }

        if (!hasExactBase && maxNum === 0) {
          description = baseTitle;
        } else {
          description = `${baseTitle} (${maxNum + 1})`;
        }
      }
    }

    const exam = await this.dbService.exam.create({
      data: {
        description: description,
        requestedItems: 70, // Standard board exam size
        status: ExamStatusEnum.GENERATING,
        subjectId: subjectId,
        questionTypes: [QuestionTypeEnum.MULTIPLE_CHOICE], // Standard board exam format
        isPracticeMode: false, // It's a "mock exam" so it counts
        isMock: true,
        timeLimit: 180, // 3 hours
        userId: userId,
        sourceFiles: {
          connect: files.map((f) => ({ id: f.id })),
        },
      },
    });

    // 3. Trigger generation
    // We can still use 'exam.created' as the event listener handles generation based on the exam state/properties
    this.eventEmitter.emit('exam.created', exam);

    this.logger.log(
      `Mock Exam [ID: ${exam.id}] created with High-Complexity Prompt. Emitting 'exam.created' event.`,
    );

    return exam;
  }
}
