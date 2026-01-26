import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FlashcardDeck, Flashcard, FlashcardReview } from '@repo/db';
import {
  CreateFlashcardDeckDTO,
  UpdateFlashcardDeckDTO,
  CreateFlashcardDTO,
  UpdateFlashcardDTO,
  ReviewFlashcardDTO,
} from '@repo/types/nest';
import { DbService } from '../db/db.service';
import { GeminiService } from '../gemini/gemini.service';

@Injectable()
export class FlashcardService {
  constructor(
    private readonly dbService: DbService,
    private readonly geminiService: GeminiService,
  ) {}

  // ========== DECK OPERATIONS ==========

  async createDeck(
    createDeckDto: CreateFlashcardDeckDTO,
    userId: string,
  ): Promise<FlashcardDeck> {
    const deck = await this.dbService.flashcardDeck.create({
      data: {
        title: createDeckDto.title,
        description: createDeckDto.description ?? null,
        subjectId: createDeckDto.subjectId ?? null,
        sourceFileId: createDeckDto.sourceFileId ?? null,
        userId,
      },
      include: {
        subject: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return deck;
  }

  async getAllDecks(userId: string): Promise<FlashcardDeck[]> {
    const decks = await this.dbService.flashcardDeck.findMany({
      where: {
        userId: userId, // Only return decks owned by this user
      },
      include: {
        subject: {
          select: {
            id: true,
            title: true,
          },
        },
        _count: {
          select: {
            cards: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return decks;
  }

  async getDeckById(id: number, userId: string): Promise<FlashcardDeck> {
    const deck = await this.dbService.flashcardDeck.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        subject: {
          select: {
            id: true,
            title: true,
          },
        },
        cards: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        _count: {
          select: {
            cards: true,
          },
        },
      },
    });

    if (!deck) {
      throw new NotFoundException('Deck not found');
    }

    return deck;
  }

  async updateDeck(
    id: number,
    updateDeckDto: UpdateFlashcardDeckDTO,
    userId: string,
  ): Promise<FlashcardDeck> {
    await this.getDeckById(id, userId);

    const updatedDeck = await this.dbService.flashcardDeck.update({
      where: { id },
      data: {
        ...(updateDeckDto.title && { title: updateDeckDto.title }),
        ...(updateDeckDto.description !== undefined && {
          description: updateDeckDto.description,
        }),
        ...(updateDeckDto.subjectId !== undefined && {
          subjectId: updateDeckDto.subjectId ?? null,
        }),
      },
      include: {
        subject: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return updatedDeck;
  }

  async deleteDeck(id: number, userId: string): Promise<void> {
    await this.getDeckById(id, userId);
    await this.dbService.flashcardDeck.delete({
      where: { id },
    });
  }

  // ========== CARD OPERATIONS ==========

  async createCard(
    createCardDto: CreateFlashcardDTO,
    userId: string,
  ): Promise<Flashcard> {
    // Verify deck ownership
    const deck = await this.dbService.flashcardDeck.findFirst({
      where: {
        id: createCardDto.deckId,
        userId,
      },
    });

    if (!deck) {
      throw new NotFoundException('Deck not found');
    }

    const card = await this.dbService.flashcard.create({
      data: {
        front: createCardDto.front,
        back: createCardDto.back,
        frontImageUrl: createCardDto.frontImageUrl ?? null,
        backImageUrl: createCardDto.backImageUrl ?? null,
        deckId: createCardDto.deckId,
      },
    });

    return card;
  }

  async getCardById(id: number, userId: string): Promise<Flashcard> {
    const card = await this.dbService.flashcard.findFirst({
      where: {
        id,
        deck: {
          userId,
        },
      },
      include: {
        deck: {
          select: {
            id: true,
            title: true,
            userId: true,
          },
        },
      },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    return card;
  }

  async updateCard(
    id: number,
    updateCardDto: UpdateFlashcardDTO,
    userId: string,
  ): Promise<Flashcard> {
    await this.getCardById(id, userId);

    const updatedCard = await this.dbService.flashcard.update({
      where: { id },
      data: {
        ...(updateCardDto.front && { front: updateCardDto.front }),
        ...(updateCardDto.back && { back: updateCardDto.back }),
        ...(updateCardDto.frontImageUrl !== undefined && {
          frontImageUrl: updateCardDto.frontImageUrl,
        }),
        ...(updateCardDto.backImageUrl !== undefined && {
          backImageUrl: updateCardDto.backImageUrl,
        }),
      },
    });

    return updatedCard;
  }

  async deleteCard(id: number, userId: string): Promise<void> {
    await this.getCardById(id, userId);
    await this.dbService.flashcard.delete({
      where: { id },
    });
  }

  // ========== SPACED REPETITION (SM-2 Algorithm) ==========

  /**
   * SM-2 Algorithm for spaced repetition
   * Based on SuperMemo 2 algorithm
   */
  private calculateNextReview(
    quality: number,
    easeFactor: number,
    interval: number,
    repetitions: number,
  ): {
    newEaseFactor: number;
    newInterval: number;
    newRepetitions: number;
  } {
    let newEaseFactor = easeFactor;
    let newInterval = interval;
    let newRepetitions = repetitions;

    // Update ease factor
    newEaseFactor =
      easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    newEaseFactor = Math.max(1.3, newEaseFactor); // Minimum ease factor

    // Update repetitions and interval based on quality
    if (quality < 3) {
      // Again or Hard - reset
      newRepetitions = 0;
      newInterval = 0;
    } else {
      // Good or Easy
      newRepetitions = repetitions + 1;

      if (newRepetitions === 1) {
        newInterval = 1;
      } else if (newRepetitions === 2) {
        newInterval = 6;
      } else {
        newInterval = Math.round(interval * newEaseFactor);
      }
    }

    return {
      newEaseFactor,
      newInterval,
      newRepetitions,
    };
  }

  async reviewCard(
    reviewDto: ReviewFlashcardDTO,
    userId: string,
  ): Promise<{
    card: Flashcard;
    review: FlashcardReview;
  }> {
    const card = await this.getCardById(reviewDto.cardId, userId);

    // Calculate next review using SM-2 algorithm
    const { newEaseFactor, newInterval, newRepetitions } =
      this.calculateNextReview(
        reviewDto.quality,
        card.easeFactor,
        card.interval,
        card.repetitions,
      );

    // Calculate next review date
    const now = new Date();
    const nextReviewAt = new Date(now);
    nextReviewAt.setDate(now.getDate() + newInterval);

    // Update card
    const updatedCard = await this.dbService.flashcard.update({
      where: { id: card.id },
      data: {
        easeFactor: newEaseFactor,
        interval: newInterval,
        repetitions: newRepetitions,
        lastReviewedAt: now,
        nextReviewAt: newInterval > 0 ? nextReviewAt : null,
      },
    });

    // Create review record
    const review = await this.dbService.flashcardReview.create({
      data: {
        cardId: card.id,
        userId,
        quality: reviewDto.quality,
        timeSpent: reviewDto.timeSpent ?? null,
      },
    });

    return {
      card: updatedCard,
      review,
    };
  }

  // ========== REVIEW QUEUE ==========

  /**
   * Get cards due for review
   */
  async getDueCards(
    deckId: number,
    userId: string,
    limit: number = 20,
  ): Promise<Flashcard[]> {
    // Verify deck ownership
    await this.getDeckById(deckId, userId);

    const now = new Date();

    const dueCards = await this.dbService.flashcard.findMany({
      where: {
        deckId,
        OR: [
          { nextReviewAt: null }, // Never reviewed
          { nextReviewAt: { lte: now } }, // Due for review
        ],
      },
      orderBy: [
        { nextReviewAt: 'asc' }, // Most overdue first
        { createdAt: 'asc' }, // Then by creation date
      ],
      take: limit,
    });

    return dueCards;
  }

  /**
   * Get review statistics for a deck
   */
  async getDeckStatistics(
    deckId: number,
    userId: string,
  ): Promise<{
    totalCards: number;
    dueCards: number;
    newCards: number;
    masteredCards: number;
    averageEaseFactor: number;
  }> {
    await this.getDeckById(deckId, userId);

    const now = new Date();

    // Fetch all cards with necessary fields in a single query
    // This replaces 4 count queries and 1 findMany query
    const cards = await this.dbService.flashcard.findMany({
      where: { deckId },
      select: {
        repetitions: true,
        interval: true,
        easeFactor: true,
        nextReviewAt: true,
      },
    });

    const totalCards = cards.length;

    const dueCards = cards.filter(
      (card) => card.nextReviewAt === null || card.nextReviewAt <= now,
    ).length;

    const newCards = cards.filter((card) => card.repetitions === 0).length;

    const masteredCards = cards.filter(
      (card) => card.repetitions >= 5 && card.interval >= 30,
    ).length;

    const averageEaseFactor =
      totalCards > 0
        ? cards.reduce((sum, card) => sum + card.easeFactor, 0) / totalCards
        : 0;

    return {
      totalCards,
      dueCards,
      newCards,
      masteredCards,
      averageEaseFactor: Math.round(averageEaseFactor * 100) / 100,
    };
  }

  // ========== AI GENERATION ==========

  /**
   * Generate flashcards from file content using AI
   */
  async generateFlashcardsFromFiles(
    fileIds: number[],
    cardCount: number,
    userId: string,
  ): Promise<Array<{ front: string; back: string }>> {
    if (fileIds.length === 0) {
      throw new BadRequestException('At least one file is required');
    }

    // Fetch files and verify ownership
    const files = await this.dbService.file.findMany({
      where: {
        id: { in: fileIds },
        userId: userId, // Only allow files owned by this user
      },
      select: {
        id: true,
        name: true,
        contentText: true,
      },
    });

    if (files.length !== fileIds.length) {
      throw new NotFoundException(
        'One or more files not found or you do not have permission to access them',
      );
    }

    // Combine file content
    const context = files
      .map((file) => file.contentText || '')
      .filter((text) => text.trim().length > 0)
      .join('\n\n---\n\n');

    if (!context.trim()) {
      throw new BadRequestException(
        'Selected files contain no text content for flashcard generation.',
      );
    }

    // Generate flashcards using AI
    const generatedCards = await this.geminiService.generateFlashcards(
      context,
      cardCount,
    );

    return generatedCards;
  }
}
