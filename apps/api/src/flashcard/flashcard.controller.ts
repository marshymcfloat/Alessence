import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FlashcardService } from './flashcard.service';
import {
  CreateFlashcardDeckDTO,
  UpdateFlashcardDeckDTO,
  CreateFlashcardDTO,
  UpdateFlashcardDTO,
  ReviewFlashcardDTO,
} from '@repo/types/nest';
import { GetUser } from 'src/auth/decorator/get-user.decorator';
import type { AuthenticatedUser } from 'src/auth/decorator/get-user.decorator';
import { FlashcardDeck, Flashcard, FlashcardReview } from '@repo/db';

@Controller('flashcard')
export class FlashcardController {
  constructor(private readonly flashcardService: FlashcardService) {}

  // ========== DECK ENDPOINTS ==========

  @UseGuards(AuthGuard('jwt'))
  @Get('deck')
  async getAllDecks(
    @GetUser() user: AuthenticatedUser,
  ): Promise<{ decks: FlashcardDeck[]; userId: string }> {
    const decks = await this.flashcardService.getAllDecks(user.userId);
    return { decks, userId: user.userId };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('deck/:id')
  async getDeckById(
    @Param('id') id: string,
    @GetUser() user: AuthenticatedUser,
  ): Promise<{ deck: FlashcardDeck; userId: string }> {
    const deck = await this.flashcardService.getDeckById(+id, user.userId);
    return { deck, userId: user.userId };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('deck/:id/statistics')
  async getDeckStatistics(
    @Param('id') id: string,
    @GetUser() user: AuthenticatedUser,
  ) {
    const statistics = await this.flashcardService.getDeckStatistics(
      +id,
      user.userId,
    );
    return { statistics, userId: user.userId };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('deck')
  async createDeck(
    @Body() createDeckDto: CreateFlashcardDeckDTO,
    @GetUser() user: AuthenticatedUser,
  ): Promise<{ deck: FlashcardDeck; userId: string }> {
    const deck = await this.flashcardService.createDeck(
      createDeckDto,
      user.userId,
    );
    return { deck, userId: user.userId };
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('deck/:id')
  async updateDeck(
    @Param('id') id: string,
    @Body() updateDeckDto: UpdateFlashcardDeckDTO,
    @GetUser() user: AuthenticatedUser,
  ): Promise<{ deck: FlashcardDeck; userId: string }> {
    const deck = await this.flashcardService.updateDeck(
      +id,
      updateDeckDto,
      user.userId,
    );
    return { deck, userId: user.userId };
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('deck/:id')
  async deleteDeck(
    @Param('id') id: string,
    @GetUser() user: AuthenticatedUser,
  ): Promise<{ success: boolean }> {
    await this.flashcardService.deleteDeck(+id, user.userId);
    return { success: true };
  }

  // ========== CARD ENDPOINTS ==========

  @UseGuards(AuthGuard('jwt'))
  @Get('deck/:deckId/cards')
  async getDeckCards(
    @Param('deckId') deckId: string,
    @GetUser() user: AuthenticatedUser,
  ): Promise<{ cards: Flashcard[]; userId: string }> {
    const deck = await this.flashcardService.getDeckById(+deckId, user.userId);
    return { cards: (deck as any).cards || [], userId: user.userId };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('card/:id')
  async getCardById(
    @Param('id') id: string,
    @GetUser() user: AuthenticatedUser,
  ): Promise<{ card: Flashcard; userId: string }> {
    const card = await this.flashcardService.getCardById(+id, user.userId);
    return { card, userId: user.userId };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('card')
  async createCard(
    @Body() createCardDto: CreateFlashcardDTO,
    @GetUser() user: AuthenticatedUser,
  ): Promise<{ card: Flashcard; userId: string }> {
    const card = await this.flashcardService.createCard(
      createCardDto,
      user.userId,
    );
    return { card, userId: user.userId };
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('card/:id')
  async updateCard(
    @Param('id') id: string,
    @Body() updateCardDto: UpdateFlashcardDTO,
    @GetUser() user: AuthenticatedUser,
  ): Promise<{ card: Flashcard; userId: string }> {
    const card = await this.flashcardService.updateCard(
      +id,
      updateCardDto,
      user.userId,
    );
    return { card, userId: user.userId };
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('card/:id')
  async deleteCard(
    @Param('id') id: string,
    @GetUser() user: AuthenticatedUser,
  ): Promise<{ success: boolean }> {
    await this.flashcardService.deleteCard(+id, user.userId);
    return { success: true };
  }

  // ========== REVIEW ENDPOINTS ==========

  @UseGuards(AuthGuard('jwt'))
  @Get('deck/:deckId/due')
  async getDueCards(
    @Param('deckId') deckId: string,
    @Query('limit') limit: string,
    @GetUser() user: AuthenticatedUser,
  ): Promise<{ cards: Flashcard[]; userId: string }> {
    const cards = await this.flashcardService.getDueCards(
      +deckId,
      user.userId,
      limit ? +limit : 20,
    );
    return { cards, userId: user.userId };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('review')
  async reviewCard(
    @Body() reviewDto: ReviewFlashcardDTO,
    @GetUser() user: AuthenticatedUser,
  ): Promise<{
    card: Flashcard;
    review: FlashcardReview;
    userId: string;
  }> {
    const result = await this.flashcardService.reviewCard(
      reviewDto,
      user.userId,
    );
    return { ...result, userId: user.userId };
  }

  // ========== AI GENERATION ENDPOINTS ==========

  @UseGuards(AuthGuard('jwt'))
  @Post('generate')
  async generateFlashcards(
    @Body() body: { fileIds: number[]; cardCount: number },
    @GetUser() user: AuthenticatedUser,
  ): Promise<{
    cards: Array<{ front: string; back: string }>;
    userId: string;
  }> {
    const cards = await this.flashcardService.generateFlashcardsFromFiles(
      body.fileIds,
      body.cardCount,
      user.userId,
    );
    return { cards, userId: user.userId };
  }
}
