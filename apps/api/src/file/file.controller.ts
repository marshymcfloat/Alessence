// file.controller.ts

import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileService } from './file.service';
import { getAllFilesReturnType } from '@repo/types';
import { GetUser } from 'src/auth/decorator/get-user.decorator';
import type { AuthenticatedUser } from 'src/auth/decorator/get-user.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadFiles(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @GetUser() user: AuthenticatedUser,
  ) {
    const uploadedFiles =
      await this.fileService.createMultipleFilesWithEmbeddings(
        files,
        user.userId,
      );

    // Trigger cross-document linking in background for each file
    for (const file of uploadedFiles) {
      // Don't await - run in background
      this.fileService.createDocumentLinks(file.id, user.userId).catch(() => {
        // Ignore linking errors
      });
    }

    return uploadedFiles;
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getAllFiles(
    @GetUser() user: AuthenticatedUser,
  ): Promise<getAllFilesReturnType> {
    const files = await this.fileService.getAllFiles(user.userId);
    return { userId: user.userId, files };
  }

  /**
   * Get cross-document links for a specific file
   */
  @UseGuards(AuthGuard('jwt'))
  @Get(':id/links')
  async getDocumentLinks(
    @Param('id', ParseIntPipe) fileId: number,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.fileService.getDocumentLinks(fileId, user.userId);
  }
}
