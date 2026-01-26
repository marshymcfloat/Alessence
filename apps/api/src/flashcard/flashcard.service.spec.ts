import { Test, TestingModule } from '@nestjs/testing';
import { FlashcardService } from './flashcard.service';
import { DbService } from '../db/db.service';
import { GeminiService } from '../gemini/gemini.service';

describe('FlashcardService', () => {
  let service: FlashcardService;
  let dbService: any;

  beforeEach(async () => {
    const mockDbService = {
      flashcardDeck: {
        findFirst: jest.fn(),
      },
      flashcard: {
        findMany: jest.fn(),
      },
    };

    const mockGeminiService = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FlashcardService,
        { provide: DbService, useValue: mockDbService },
        { provide: GeminiService, useValue: mockGeminiService },
      ],
    }).compile();

    service = module.get<FlashcardService>(FlashcardService);
    dbService = module.get<DbService>(DbService);
  });

  it('should calculate deck statistics correctly', async () => {
    // Mock deck exists
    dbService.flashcardDeck.findFirst.mockResolvedValue({ id: 1, userId: 'user1' });

    const now = new Date();
    // Create dates relative to now to ensure stability
    const pastDate = new Date(now.getTime() - 100000);
    const futureDate = new Date(now.getTime() + 100000);

    const mockCards = [
      // 1. Due card (past)
      {
        easeFactor: 2.5,
        repetitions: 1,
        interval: 1,
        nextReviewAt: pastDate
      },
      // 2. New card (never reviewed, so due)
      {
        easeFactor: 2.5,
        repetitions: 0,
        interval: 0,
        nextReviewAt: null
      },
      // 3. Mastered card (reps >= 5, interval >= 30, future)
      {
        easeFactor: 3.0,
        repetitions: 6,
        interval: 40,
        nextReviewAt: futureDate
      },
      // 4. Learning/Normal card (future)
      {
        easeFactor: 2.0,
        repetitions: 2,
        interval: 3,
        nextReviewAt: futureDate
      }
    ];

    // Mock findMany to return the cards
    // Note: The service might select specific fields, but our mock returns full objects which is compatible
    dbService.flashcard.findMany.mockResolvedValue(mockCards);

    const stats = await service.getDeckStatistics(1, 'user1');

    expect(stats.totalCards).toBe(4);
    expect(stats.dueCards).toBe(2);
    expect(stats.newCards).toBe(1);
    expect(stats.masteredCards).toBe(1);
    expect(stats.averageEaseFactor).toBe(2.5); // (2.5 + 2.5 + 3.0 + 2.0) / 4 = 2.5
  });
});
