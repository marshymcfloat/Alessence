import {
  Injectable,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { DbService } from '../db/db.service';
import { put } from '@vercel/blob';
import { File, AcceptedFileType, DocumentLinkType } from '@repo/db';
import { GoogleGenAI } from '@google/genai';
import { GeminiService } from '../gemini/gemini.service';

import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';

type MulterFile = Express.Multer.File;

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);
  private readonly genAI: GoogleGenAI;

  constructor(
    private readonly dbService: DbService,
    private readonly geminiService: GeminiService,
  ) {
    this.genAI = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!,
    });
  }

  async createMultipleFilesWithEmbeddings(
    files: MulterFile[],
    userId: string,
  ): Promise<File[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files were provided for upload.');
    }

    const createdDbFiles = await Promise.all(
      files.map((file) => this.createFileWithEmbedding(file, userId)),
    );

    return createdDbFiles;
  }

  async createFileWithEmbedding(
    file: MulterFile,
    userId: string,
  ): Promise<File> {
    if (!file) {
      throw new BadRequestException('A file object is required.');
    }

    try {
      const existingFile = await this.dbService.file.findUnique({
        where: {
          name: file.originalname,
        },
      });

      if (existingFile) {
        const randomSuffix = Math.floor(Math.random() * 100000);
        const nameParts = file.originalname.split('.');
        if (nameParts.length > 1) {
          const ext = nameParts.pop();
          file.originalname = `${nameParts.join('.')}-${randomSuffix}.${ext}`;
        } else {
          file.originalname = `${file.originalname}-${randomSuffix}`;
        }
      }

      const blob = await put(file.originalname, file.buffer, {
        access: 'public',
        addRandomSuffix: true,
      });

      const fileText = await this.getTextFromFile(file);

      if (!fileText || fileText.trim().length === 0) {
        throw new BadRequestException(
          `Could not extract text from the file "${file.originalname}" or the file is empty.`,
        );
      }

      const embeddingResponse = await this.genAI.models.embedContent({
        model: 'text-embedding-004',
        contents: fileText,
      });

      const embedding = embeddingResponse.embeddings?.[0]?.values;

      if (!embedding) {
        throw new Error(
          `Failed to generate or extract embedding for the file "${file.originalname}".`,
        );
      }

      const fileType = this.mapMimeTypeToEnum(file.mimetype);

      const newDbFile = await this.dbService.file.create({
        data: {
          name: file.originalname,
          fileUrl: blob.url,
          size: file.size,
          type: fileType,
          contentText: fileText,
          userId: userId, // Set user ownership
        },
      });

      const vector = JSON.stringify(embedding);
      await this.dbService.$executeRaw`
        UPDATE "File"
        SET embedding = ${vector}::vector
        WHERE id = ${newDbFile.id}
      `;

      return newDbFile;
    } catch (error) {
      console.error(`Failed to process file ${file.originalname}:`, error);
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      if (error instanceof Error) {
        throw new Error(
          `Failed on file ${file.originalname}: ${error.message}`,
        );
      }
      throw new Error(
        `An unknown error occurred while processing file ${file.originalname}.`,
      );
    }
  }

  async getAllFiles(userId: string): Promise<File[]> {
    const files = await this.dbService.file.findMany({
      where: {
        userId: userId, // Only return files owned by this user
      },
    });
    return files;
  }

  private async getTextFromFile(file: MulterFile): Promise<string> {
    const { buffer, mimetype } = file;

    if (mimetype === 'application/pdf') {
      const parser = new PDFParse(new Uint8Array(buffer));
      const data = await parser.getText();
      return data.text;
    }

    if (
      mimetype ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const { value } = await mammoth.extractRawText({ buffer });
      return value;
    }

    if (mimetype === 'text/plain') {
      return buffer.toString('utf-8');
    }

    throw new BadRequestException(`Unsupported file type: ${mimetype}`);
  }

  private mapMimeTypeToEnum(mimetype: string): AcceptedFileType {
    if (mimetype === 'application/pdf') return AcceptedFileType.PDF;
    if (
      mimetype ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
      return AcceptedFileType.DOCX;
    if (mimetype === 'text/plain') return AcceptedFileType.TEXT;

    throw new Error(
      `Mime type ${mimetype} does not map to an AcceptedFileType.`,
    );
  }

  /**
   * Find and create cross-document links for a newly uploaded file
   */
  async createDocumentLinks(fileId: number, userId: string): Promise<void> {
    try {
      const file = await this.dbService.file.findFirst({
        where: { id: fileId, userId },
      });

      if (!file || !file.contentText) {
        return;
      }

      // Get existing topics from the user's syllabus
      const topics = await this.dbService.topic.findMany({
        where: {
          subject: {
            OR: [
              { userId },
              { userId: null }, // System subjects (CPALE syllabus)
            ],
          },
        },
        select: { id: true, title: true },
      });

      // Get existing notes
      const notes = await this.dbService.note.findMany({
        where: { userId },
        select: { id: true, title: true },
      });

      // Get existing files (excluding the current one)
      const otherFiles = await this.dbService.file.findMany({
        where: { userId, id: { not: fileId } },
        select: { id: true, name: true },
      });

      // Combine all existing items for linking
      const existingTopics = [
        ...topics.map((t) => `Topic: ${t.title}`),
        ...notes.map((n) => `Note: ${n.title}`),
        ...otherFiles.map((f) => `File: ${f.name}`),
      ];

      if (existingTopics.length === 0) {
        return;
      }

      // Find related topics using AI
      const relatedItems = await this.geminiService.findRelatedTopics(
        file.contentText,
        existingTopics,
      );

      // Create links for each related item
      for (const item of relatedItems) {
        let targetType: DocumentLinkType;
        let targetId: number;

        if (item.topic.startsWith('Topic: ')) {
          const topicTitle = item.topic.replace('Topic: ', '');
          const topic = topics.find((t) => t.title === topicTitle);
          if (!topic) continue;
          targetType = DocumentLinkType.TOPIC;
          targetId = topic.id;
        } else if (item.topic.startsWith('Note: ')) {
          const noteTitle = item.topic.replace('Note: ', '');
          const note = notes.find((n) => n.title === noteTitle);
          if (!note) continue;
          targetType = DocumentLinkType.NOTE;
          targetId = note.id;
        } else if (item.topic.startsWith('File: ')) {
          const fileName = item.topic.replace('File: ', '');
          const otherFile = otherFiles.find((f) => f.name === fileName);
          if (!otherFile) continue;
          targetType = DocumentLinkType.FILE;
          targetId = otherFile.id;
        } else {
          continue;
        }

        // Create the link (upsert to avoid duplicates)
        await this.dbService.documentLink.upsert({
          where: {
            sourceType_sourceId_targetType_targetId: {
              sourceType: DocumentLinkType.FILE,
              sourceId: fileId,
              targetType,
              targetId,
            },
          },
          create: {
            sourceType: DocumentLinkType.FILE,
            sourceId: fileId,
            targetType,
            targetId,
            relevance: item.relevance,
            reason: item.reason,
            userId,
          },
          update: {
            relevance: item.relevance,
            reason: item.reason,
          },
        });
      }

      this.logger.log(
        `Created ${relatedItems.length} document links for file ${fileId}`,
      );
    } catch (error) {
      this.logger.error('Error creating document links:', error);
      // Don't throw - linking is not critical
    }
  }

  /**
   * Get all document links for a file
   */
  async getDocumentLinks(fileId: number, userId: string) {
    const links = await this.dbService.documentLink.findMany({
      where: {
        userId,
        OR: [
          { sourceType: DocumentLinkType.FILE, sourceId: fileId },
          { targetType: DocumentLinkType.FILE, targetId: fileId },
        ],
      },
      orderBy: { relevance: 'desc' },
    });

    // Enrich links with target names
    // Optimization: Collect IDs and fetch in bulk to avoid N+1 queries
    const fileIds: number[] = [];
    const noteIds: number[] = [];
    const topicIds: number[] = [];

    // Pre-process links to identify targets
    const linksWithTargetInfo = links.map((link) => {
      const isSource =
        link.sourceType === DocumentLinkType.FILE && link.sourceId === fileId;
      const linkedType = isSource ? link.targetType : link.sourceType;
      const linkedId = isSource ? link.targetId : link.sourceId;

      if (linkedType === DocumentLinkType.FILE) fileIds.push(linkedId);
      if (linkedType === DocumentLinkType.NOTE) noteIds.push(linkedId);
      if (linkedType === DocumentLinkType.TOPIC) topicIds.push(linkedId);

      return { ...link, linkedType, linkedId };
    });

    // Bulk fetch names using Promise.all for concurrency
    const [files, notes, topics] = await Promise.all([
      fileIds.length > 0
        ? this.dbService.file.findMany({
            where: { id: { in: fileIds } },
            select: { id: true, name: true },
          })
        : Promise.resolve([] as { id: number; name: string }[]),
      noteIds.length > 0
        ? this.dbService.note.findMany({
            where: { id: { in: noteIds } },
            select: { id: true, title: true },
          })
        : Promise.resolve([] as { id: number; title: string }[]),
      topicIds.length > 0
        ? this.dbService.topic.findMany({
            where: { id: { in: topicIds } },
            select: { id: true, title: true },
          })
        : Promise.resolve([] as { id: number; title: string }[]),
    ]);

    // Create lookup maps for O(1) access
    const fileMap = new Map(files.map((f) => [f.id, f.name]));
    const noteMap = new Map(notes.map((n) => [n.id, n.title]));
    const topicMap = new Map(topics.map((t) => [t.id, t.title]));

    // Map names back to links
    const enrichedLinks = linksWithTargetInfo.map((link) => {
      let linkedName = 'Unknown';

      if (link.linkedType === DocumentLinkType.FILE) {
        linkedName = fileMap.get(link.linkedId) || 'Unknown File';
      } else if (link.linkedType === DocumentLinkType.NOTE) {
        linkedName = noteMap.get(link.linkedId) || 'Unknown Note';
      } else if (link.linkedType === DocumentLinkType.TOPIC) {
        linkedName = topicMap.get(link.linkedId) || 'Unknown Topic';
      }

      return {
        ...link,
        linkedName,
      };
    });

    return enrichedLinks;
  }
}
