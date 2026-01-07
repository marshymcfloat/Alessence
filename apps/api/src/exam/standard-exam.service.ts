import { Injectable, Logger } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { FileService } from 'src/file/file.service';
import { ExamStatusEnum, QuestionTypeEnum } from '@repo/db';
import { AuthenticatedUser } from 'src/auth/decorator/get-user.decorator';
import { CreateExamDto } from '@repo/types/nest';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Exam } from '@repo/db';

type MulterFile = Express.Multer.File;

@Injectable()
export class StandardExamService {
  private readonly logger = new Logger(StandardExamService.name);

  constructor(
    private readonly dbService: DbService,
    private readonly fileService: FileService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(
    dto: CreateExamDto,
    newFiles: MulterFile[],
    user: AuthenticatedUser,
  ): Promise<Exam> {
    if (!user?.userId) {
      throw new Error('User authentication is required');
    }

    let newFileIds: number[] = [];

    if (newFiles && newFiles.length > 0) {
      const createdFiles =
        await this.fileService.createMultipleFilesWithEmbeddings(
          newFiles,
          user.userId,
        );
      newFileIds = createdFiles.map((file) => file.id);
    }

    // Validate that all existing file IDs belong to the user OR are shared with them
    if (dto.existingFileIds && dto.existingFileIds.length > 0) {
      const requestedFileIds = dto.existingFileIds.map((id) => +id);

      const existingFiles = await this.dbService.file.findMany({
        where: {
          id: { in: requestedFileIds },
        },
        select: {
          id: true,
          userId: true,
        },
      });

      // Check if all files exist
      const fileIdsSet = new Set(existingFiles.map((f) => f.id));
      const requestedFileIdsSet = new Set(requestedFileIds);

      if (fileIdsSet.size !== requestedFileIdsSet.size) {
        throw new Error('One or more requested files do not exist');
      }

      // Check which files don't belong to the user (need to check if shared)
      const notOwnedFileIds = existingFiles
        .filter((file) => file.userId !== user.userId)
        .map((file) => file.id);

      if (notOwnedFileIds.length > 0) {
        // Check if these files are shared with the user
        const sharedFiles = await this.dbService.sharedFile.findMany({
          where: {
            fileId: { in: notOwnedFileIds },
            recipientId: user.userId,
          },
          select: {
            fileId: true,
          },
        });

        const sharedFileIds = new Set(sharedFiles.map((sf) => sf.fileId));
        const unauthorizedFiles = notOwnedFileIds.filter(
          (id) => !sharedFileIds.has(id),
        );

        if (unauthorizedFiles.length > 0) {
          throw new Error(
            'You do not have permission to use one or more of the selected files',
          );
        }
      }
    }

    const allSourceFileIds = [...(dto.existingFileIds || []), ...newFileIds];

    // Validate that the subject belongs to the user
    const subject = await this.dbService.subject.findFirst({
      where: {
        id: +dto.subjectId,
        userId: user.userId,
      },
    });

    if (!subject) {
      throw new Error(
        'Subject not found or you do not have permission to use it',
      );
    }

    const exam = await this.dbService.exam.create({
      data: {
        description: dto.describe,
        requestedItems: +dto.items,
        status: ExamStatusEnum.GENERATING,
        subjectId: +dto.subjectId,
        questionTypes: dto.questionTypes as QuestionTypeEnum[],
        isPracticeMode:
          dto.isPracticeMode === true ||
          (dto.isPracticeMode as unknown) === 'true',
        isMock: dto.describe?.includes('FINALS SIMULATION') || false,
        timeLimit: dto.timeLimit ? +dto.timeLimit : null,
        userId: user.userId, // Set user ownership
        sourceFiles: {
          connect: allSourceFileIds.map((id) => ({ id: +id })),
        },
      },
    });

    this.eventEmitter.emit('exam.created', exam);

    this.logger.log(
      `Standard Exam [ID: ${exam.id}] created. Emitting 'exam.created' event.`,
    );

    return exam;
  }
}
