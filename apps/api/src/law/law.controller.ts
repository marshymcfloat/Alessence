import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { LawService } from './law.service';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/decorator/get-user.decorator';
import type { AuthenticatedUser } from '../auth/decorator/get-user.decorator';
import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class GenerateCaseDigestDto {
  @IsString()
  @IsNotEmpty()
  caseText: string;
}

export class GenerateCodalFlashcardsDto {
  @IsString()
  @IsNotEmpty()
  articleText: string;

  @IsString()
  @IsOptional()
  lawName?: string;

  @IsNumber()
  @IsOptional()
  deckId?: number;
}

export class GenerateFlashcardsFromFileDto {
  @IsNumber()
  @IsNotEmpty()
  fileId: number;

  @IsNumber()
  @IsOptional()
  deckId?: number;
}

@Controller('law')
@UseGuards(AuthGuard('jwt'))
export class LawController {
  constructor(private readonly lawService: LawService) {}

  /**
   * Generate a structured case digest from full case text
   */
  @Post('case-digest')
  async generateCaseDigest(
    @Body() dto: GenerateCaseDigestDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.lawService.generateCaseDigest(dto.caseText, user.userId);
  }

  /**
   * Generate flashcards from a legal codal article/provision
   */
  @Post('codal-flashcards')
  async generateCodalFlashcards(
    @Body() dto: GenerateCodalFlashcardsDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.lawService.generateCodalFlashcards(
      dto.articleText,
      dto.lawName,
      user.userId,
      dto.deckId,
    );
  }

  /**
   * Generate flashcards from an uploaded file containing legal articles
   */
  @Post('codal-flashcards/from-file')
  async generateFlashcardsFromFile(
    @Body() dto: GenerateFlashcardsFromFileDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.lawService.generateFlashcardsFromFile(
      dto.fileId,
      user.userId,
      dto.deckId,
    );
  }
}

