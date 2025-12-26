import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { put } from '@vercel/blob';
import { File, AcceptedFileType } from '@repo/db';
import { GoogleGenAI } from '@google/genai';

import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';

type MulterFile = Express.Multer.File;

@Injectable()
export class FileService {
  private readonly genAI: GoogleGenAI;

  constructor(private readonly dbService: DbService) {
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

  async createFileWithEmbedding(file: MulterFile, userId: string): Promise<File> {
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
        throw new ConflictException(
          `A file with the name "${file.originalname}" already exists.`,
        );
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
}
