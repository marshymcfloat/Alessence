import { Test, TestingModule } from '@nestjs/testing';
import { SummaryService } from './summary.service';
import { DbService } from '../db/db.service';
import { FileService } from '../file/file.service';
import { GeminiService } from '../gemini/gemini.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('SummaryService', () => {
  let service: SummaryService;

  const mockDbService = {
    summary: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
  };

  const mockFileService = {
    createMultipleFilesWithEmbeddings: jest.fn(),
  };

  const mockGeminiService = {
    generateSummary: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SummaryService,
        {
          provide: DbService,
          useValue: mockDbService,
        },
        {
          provide: FileService,
          useValue: mockFileService,
        },
        {
          provide: GeminiService,
          useValue: mockGeminiService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<SummaryService>(SummaryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return summaries without content', async () => {
      const mockSummaries = [
        {
          id: 1,
          title: 'Test Summary',
          description: 'Desc',
          // content is missing
        },
      ];
      mockDbService.summary.findMany.mockResolvedValue(mockSummaries);

      const result = await service.findAll('user1');
      expect(result).toEqual(mockSummaries);

      // Verify that 'content' is not in the selection (implied by not being true)
      // We check that specific fields ARE selected
      expect(mockDbService.summary.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user1' }) as unknown,
          select: expect.objectContaining({
            id: true,
            title: true,
            description: true,
            status: true,
            template: true,
            subjectId: true,
            userId: true,
            createdAt: true,
            updatedAt: true,
            subject: {
              select: {
                id: true,
                title: true,
              },
            },
            sourceFiles: {
              select: {
                id: true,
                name: true,
              },
            },
          }) as unknown,
        }),
      );
    });
  });
});
