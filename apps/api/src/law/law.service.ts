import { Injectable, BadRequestException } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { GeminiService } from 'src/gemini/gemini.service';

export interface CaseDigest {
  title: string;
  citation: string;
  facts: string;
  issues: string[];
  ruling: string;
  ratio: string;
  doctrine: string;
}

export interface CodalFlashcard {
  front: string;
  back: string;
  category: string;
}

@Injectable()
export class LawService {
  constructor(
    private readonly dbService: DbService,
    private readonly geminiService: GeminiService,
  ) {}

  /**
   * Generate a case digest from full case text
   */
  async generateCaseDigest(caseText: string, userId: string): Promise<CaseDigest> {
    if (!caseText || caseText.trim().length < 100) {
      throw new BadRequestException('Case text is too short. Please provide the full case text.');
    }

    const digest = await this.geminiService.generateCaseDigest(caseText);
    
    // Optionally save to notes
    // This could be expanded to auto-save digests
    
    return digest;
  }

  /**
   * Generate flashcards from a legal codal article/provision
   */
  async generateCodalFlashcards(
    articleText: string,
    lawName: string | undefined,
    userId: string,
    deckId?: number,
  ): Promise<{ flashcards: CodalFlashcard[]; savedCount?: number }> {
    if (!articleText || articleText.trim().length < 20) {
      throw new BadRequestException('Article text is too short. Please provide the full provision.');
    }

    const flashcards = await this.geminiService.generateCodalFlashcards(articleText, lawName);

    // If deckId is provided, save to existing deck
    if (deckId) {
      const deck = await this.dbService.flashcardDeck.findFirst({
        where: { id: deckId, userId },
      });

      if (!deck) {
        throw new BadRequestException('Flashcard deck not found.');
      }

      // Create flashcards in the deck
      await this.dbService.flashcard.createMany({
        data: flashcards.map((card, index) => ({
          deckId,
          front: card.front,
          back: card.back,
          order: index,
        })),
      });

      return { flashcards, savedCount: flashcards.length };
    }

    return { flashcards };
  }

  /**
   * Generate flashcards from a file containing legal articles
   */
  async generateFlashcardsFromFile(
    fileId: number,
    userId: string,
    deckId?: number,
  ): Promise<{ flashcards: CodalFlashcard[]; savedCount?: number }> {
    const file = await this.dbService.file.findFirst({
      where: { id: fileId, userId },
    });

    if (!file || !file.contentText) {
      throw new BadRequestException('File not found or has no text content.');
    }

    return this.generateCodalFlashcards(file.contentText, file.name, userId, deckId);
  }

  /**
   * Generate expert tax advice
   */
  async generateTaxAdvice(query: string, userId: string): Promise<{
    answer: string;
    citations: string[];
    disclaimer: string;
  }> {
    if (!query || query.trim().length < 5) {
      throw new BadRequestException('Query is too short.');
    }

    return this.geminiService.generateTaxAdvice(query);
  }
}

