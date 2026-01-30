import { Test, TestingModule } from '@nestjs/testing';
import { FileService } from './file.service';
import { DbService } from '../db/db.service';
import { GeminiService } from '../gemini/gemini.service';
import { DocumentLinkType } from '@repo/db';

describe('FileService', () => {
  let service: FileService;
  let dbService: any;

  const mockDbService = {
    documentLink: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    file: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      $executeRaw: jest.fn(),
    },
    note: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    topic: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    $executeRaw: jest.fn(),
  };

  const mockGeminiService = {
    findRelatedTopics: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileService,
        {
          provide: DbService,
          useValue: mockDbService,
        },
        {
          provide: GeminiService,
          useValue: mockGeminiService,
        },
      ],
    }).compile();

    service = module.get<FileService>(FileService);
    dbService = module.get<DbService>(DbService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDocumentLinks', () => {
    it('should resolve document links using findMany (optimized)', async () => {
      const fileId = 1;
      const userId = 'user-1';

      const mockLinks = [
        {
          id: 1,
          sourceType: DocumentLinkType.FILE,
          sourceId: fileId,
          targetType: DocumentLinkType.FILE,
          targetId: 2,
          relevance: 90,
          userId,
        },
        {
          id: 2,
          sourceType: DocumentLinkType.FILE,
          sourceId: fileId,
          targetType: DocumentLinkType.NOTE,
          targetId: 3,
          relevance: 80,
          userId,
        },
        {
          id: 3,
          sourceType: DocumentLinkType.FILE,
          sourceId: fileId,
          targetType: DocumentLinkType.TOPIC,
          targetId: 4,
          relevance: 70,
          userId,
        },
      ];

      mockDbService.documentLink.findMany.mockResolvedValue(mockLinks);

      // Setup findUnique mocks to verify they are NOT called
      mockDbService.file.findUnique.mockResolvedValue({
        id: 2,
        name: 'Target File',
      });
      mockDbService.note.findUnique.mockResolvedValue({
        id: 3,
        title: 'Target Note',
      });
      mockDbService.topic.findUnique.mockResolvedValue({
        id: 4,
        title: 'Target Topic',
      });

      // Setup findMany mocks for the optimized implementation
      mockDbService.file.findMany.mockResolvedValue([
        { id: 2, name: 'Target File' },
      ]);
      mockDbService.note.findMany.mockResolvedValue([
        { id: 3, title: 'Target Note' },
      ]);
      mockDbService.topic.findMany.mockResolvedValue([
        { id: 4, title: 'Target Topic' },
      ]);

      const result = await service.getDocumentLinks(fileId, userId);

      // Verify result structure
      expect(result).toHaveLength(3);
      expect(result[0].linkedName).toBe('Target File');
      expect(result[1].linkedName).toBe('Target Note');
      expect(result[2].linkedName).toBe('Target Topic');

      // Verify optimization: findUnique should NOT be called for resolution
      // Note: If the code is unoptimized, these expects will fail
      expect(mockDbService.file.findUnique).not.toHaveBeenCalled();
      expect(mockDbService.note.findUnique).not.toHaveBeenCalled();
      expect(mockDbService.topic.findUnique).not.toHaveBeenCalled();

      // Verify findMany was called
      // We check if it was called with the correct IDs. Since findMany might be called for other reasons (e.g. getAllFiles), we should be specific.
      // But in this method, it's the only place findMany would be called for resolution.

      // Check that findMany is called at least once for each type with correct ID
      const fileCall = mockDbService.file.findMany.mock.calls.find((call) =>
        call[0]?.where?.id?.in?.includes(2),
      );
      expect(fileCall).toBeTruthy();

      const noteCall = mockDbService.note.findMany.mock.calls.find((call) =>
        call[0]?.where?.id?.in?.includes(3),
      );
      expect(noteCall).toBeTruthy();

      const topicCall = mockDbService.topic.findMany.mock.calls.find((call) =>
        call[0]?.where?.id?.in?.includes(4),
      );
      expect(topicCall).toBeTruthy();
    });
  });
});
