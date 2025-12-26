import { Injectable, Logger } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { FileService } from 'src/file/file.service';
import { GeminiService } from 'src/gemini/gemini.service';
import { SummaryStatusEnum, SummaryTemplateEnum } from '@repo/db';
import { AuthenticatedUser } from 'src/auth/decorator/get-user.decorator';
import { CreateSummaryDto } from '@repo/types/nest';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import type { Summary, File } from '@repo/db';
type MulterFile = Express.Multer.File;

@Injectable()
export class SummaryService {
  private readonly logger = new Logger(SummaryService.name);

  constructor(
    private readonly dbService: DbService,
    private readonly fileService: FileService,
    private readonly eventEmitter: EventEmitter2,
    private readonly geminiService: GeminiService,
  ) {}

  async create(
    dto: CreateSummaryDto,
    newFiles: MulterFile[],
    user: AuthenticatedUser,
  ): Promise<Summary> {
    let newFileIds: number[] = [];

    if (newFiles && newFiles.length > 0) {
      const createdFiles =
        await this.fileService.createMultipleFilesWithEmbeddings(newFiles, user.userId);
      newFileIds = createdFiles.map((file) => file.id);
    }

    const allSourceFileIds = [...(dto.existingFileIds || []), ...newFileIds];

    if (allSourceFileIds.length === 0) {
      throw new Error('A summary must have at least one source file.');
    }

    const summary = await this.dbService.summary.create({
      data: {
        title: dto.title,
        description: dto.description,
        status: SummaryStatusEnum.GENERATING,
        template: (dto.template || 'COMPREHENSIVE') as SummaryTemplateEnum,
        subjectId: dto.subjectId ? +dto.subjectId : undefined,
        userId: user.userId, // Set user ownership
        sourceFiles: {
          connect: allSourceFileIds.map((id) => ({ id: +id })),
        },
      },
    });

    this.eventEmitter.emit('summary.created', summary);

    this.logger.log(
      `Summary [ID: ${summary.id}] created. Emitting 'summary.created' event.`,
    );

    return summary;
  }

  async findAll(userId: string, subjectId?: number): Promise<Summary[]> {
    return this.dbService.summary.findMany({
      where: {
        userId: userId, // Only return summaries owned by this user
        ...(subjectId ? { subjectId } : {}),
      },
      include: {
        subject: {
          select: {
            id: true,
            title: true,
          },
        },
        sourceFiles: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number, userId: string): Promise<Summary | null> {
    return this.dbService.summary.findFirst({
      where: { 
        id,
        userId: userId, // Verify ownership
      },
      include: {
        subject: {
          select: {
            id: true,
            title: true,
          },
        },
        sourceFiles: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async remove(id: number, userId: string): Promise<void> {
    // Verify ownership before deletion
    const summary = await this.dbService.summary.findFirst({
      where: { id, userId },
    });

    if (!summary) {
      throw new Error('Summary not found or you do not have permission to delete it.');
    }

    await this.dbService.summary.delete({
      where: { id },
    });
    this.logger.log(`Summary [ID: ${id}] deleted by user [${userId}].`);
  }

  @OnEvent('summary.created')
  async handleSummaryCreated(summary: Summary) {
    this.logger.log(
      `Handling 'summary.created' event for Summary [ID: ${summary.id}]`,
    );

    try {
      const summaryWithFiles = (await this.dbService.summary.findUniqueOrThrow({
        where: { id: summary.id },
        include: { sourceFiles: true },
      })) as Summary & { sourceFiles: File[] };

      if (
        !summaryWithFiles.sourceFiles ||
        summaryWithFiles.sourceFiles.length === 0
      ) {
        throw new Error('Summary has no source files.');
      }

      const sourceText = summaryWithFiles.sourceFiles
        .map((file) => file.contentText)
        .filter((text) => text && text.trim())
        .join('\n\n---\n\n');

      if (!sourceText || !sourceText.trim()) {
        throw new Error('Source files contain no text content.');
      }

      this.logger.log(`Generating summary for Summary [ID: ${summary.id}]...`);

      const generatedSummary = await this.geminiService.generateSummary(
        sourceText,
        summaryWithFiles.description,
        summaryWithFiles.template,
      );

      if (!generatedSummary || !generatedSummary.trim()) {
        throw new Error(
          `No summary was generated for Summary [ID: ${summary.id}].`,
        );
      }

      this.logger.log(
        `Generated summary for Summary [ID: ${summary.id}]. Saving to database...`,
      );

      await this.dbService.summary.update({
        where: { id: summary.id },
        data: {
          content: generatedSummary.trim(),
          status: SummaryStatusEnum.READY,
        },
      });

      this.logger.log(
        `Successfully generated and saved summary for Summary [ID: ${summary.id}]. Status updated to READY.`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to generate summary [ID: ${summary.id}]: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );

      try {
        await this.dbService.summary.update({
          where: { id: summary.id },
          data: { status: SummaryStatusEnum.FAILED },
        });
        this.logger.log(
          `Updated summary [ID: ${summary.id}] status to FAILED due to generation error.`,
        );
      } catch (updateError) {
        this.logger.error(
          `Failed to update summary [ID: ${summary.id}] status to FAILED: ${updateError instanceof Error ? updateError.message : String(updateError)}`,
        );
      }
    }
  }
}
