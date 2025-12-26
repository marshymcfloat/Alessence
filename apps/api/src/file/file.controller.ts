// file.controller.ts

import {
  Controller,
  Get,
  Post,
  UploadedFiles, // <-- Changed from UploadedFile
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
    return this.fileService.createMultipleFilesWithEmbeddings(files, user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getAllFiles(
    @GetUser() user: AuthenticatedUser,
  ): Promise<getAllFilesReturnType> {
    const files = await this.fileService.getAllFiles(user.userId);
    return { userId: user.userId, files };
  }
}
