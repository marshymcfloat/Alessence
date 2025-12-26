import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SharingService } from './sharing.service';
import { GetUser } from 'src/auth/decorator/get-user.decorator';
import type { AuthenticatedUser } from 'src/auth/decorator/get-user.decorator';
import { SharePermission } from '@repo/db';

interface ShareDto {
  recipientId: string;
  permission?: SharePermission;
}

interface CopyDeckDto {
  subjectId?: number;
}

@Controller('sharing')
@UseGuards(AuthGuard('jwt'))
export class SharingController {
  constructor(private readonly sharingService: SharingService) {}

  // ==================== FILES ====================

  @Post('file/:fileId')
  shareFile(
    @Param('fileId', ParseIntPipe) fileId: number,
    @Body() dto: ShareDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.sharingService.shareFile(
      fileId,
      user.userId,
      dto.recipientId,
      dto.permission,
    );
  }

  @Delete('file/:shareId')
  unshareFile(
    @Param('shareId', ParseIntPipe) shareId: number,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.sharingService.unshareFile(shareId, user.userId);
  }

  @Get('files/received')
  getFilesSharedWithMe(@GetUser() user: AuthenticatedUser) {
    return this.sharingService.getFilesSharedWithMe(user.userId);
  }

  @Get('files/sent')
  getFilesSharedByMe(@GetUser() user: AuthenticatedUser) {
    return this.sharingService.getFilesSharedByMe(user.userId);
  }

  // ==================== NOTES ====================

  @Post('note/:noteId')
  shareNote(
    @Param('noteId', ParseIntPipe) noteId: number,
    @Body() dto: ShareDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.sharingService.shareNote(
      noteId,
      user.userId,
      dto.recipientId,
      dto.permission,
    );
  }

  @Delete('note/:shareId')
  unshareNote(
    @Param('shareId', ParseIntPipe) shareId: number,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.sharingService.unshareNote(shareId, user.userId);
  }

  @Get('notes/received')
  getNotesSharedWithMe(@GetUser() user: AuthenticatedUser) {
    return this.sharingService.getNotesSharedWithMe(user.userId);
  }

  @Get('notes/sent')
  getNotesSharedByMe(@GetUser() user: AuthenticatedUser) {
    return this.sharingService.getNotesSharedByMe(user.userId);
  }

  // ==================== FLASHCARD DECKS ====================

  @Post('deck/:deckId')
  shareDeck(
    @Param('deckId', ParseIntPipe) deckId: number,
    @Body() dto: ShareDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.sharingService.shareDeck(
      deckId,
      user.userId,
      dto.recipientId,
      dto.permission,
    );
  }

  @Delete('deck/:shareId')
  unshareDeck(
    @Param('shareId', ParseIntPipe) shareId: number,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.sharingService.unshareDeck(shareId, user.userId);
  }

  @Get('decks/received')
  getDecksSharedWithMe(@GetUser() user: AuthenticatedUser) {
    return this.sharingService.getDecksSharedWithMe(user.userId);
  }

  @Get('decks/sent')
  getDecksSharedByMe(@GetUser() user: AuthenticatedUser) {
    return this.sharingService.getDecksSharedByMe(user.userId);
  }

  @Post('deck/:shareId/copy')
  copySharedDeck(
    @Param('shareId', ParseIntPipe) shareId: number,
    @Body() dto: CopyDeckDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.sharingService.copySharedDeck(shareId, user.userId, dto.subjectId);
  }

  // ==================== SUMMARY ====================

  @Get('summary')
  getSharedWithMeSummary(@GetUser() user: AuthenticatedUser) {
    return this.sharingService.getSharedWithMeSummary(user.userId);
  }
}

