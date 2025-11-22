import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  ParseIntPipe,
} from '@nestjs/common';
import { SummaryService } from './summary.service';
import { AuthGuard } from '@nestjs/passport';
import { FilesInterceptor } from '@nestjs/platform-express';
import { GetUser } from 'src/auth/decorator/get-user.decorator';
import type { AuthenticatedUser } from 'src/auth/decorator/get-user.decorator';
import { CreateSummaryDto } from '@repo/types/nest';

@Controller('summary')
export class SummaryController {
  constructor(private readonly summaryService: SummaryService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FilesInterceptor('newFiles', 10))
  create(
    @Body() createSummaryDto: CreateSummaryDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.summaryService.create(createSummaryDto, files, user);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  findAll(@Query('subjectId') subjectId?: string) {
    return this.summaryService.findAll(
      subjectId ? parseInt(subjectId, 10) : undefined,
    );
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.summaryService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.summaryService.remove(id);
  }
}

