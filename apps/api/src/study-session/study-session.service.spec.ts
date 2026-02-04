import { Test, TestingModule } from '@nestjs/testing';
import { StudySessionService } from './study-session.service';
import { DbService } from '../db/db.service';
import { SessionStatusEnum } from '@repo/db';

const mockDbService = {
  studySession: {
    findMany: jest.fn(),
    aggregate: jest.fn(),
  },
};

describe('StudySessionService', () => {
  let service: StudySessionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudySessionService,
        {
          provide: DbService,
          useValue: mockDbService,
        },
      ],
    }).compile();

    service = module.get<StudySessionService>(StudySessionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAll', () => {
    it('should return sessions and aggregated stats', async () => {
      const userId = 'user-1';
      const sessions = [{ id: 1, userId, status: SessionStatusEnum.COMPLETED }];
      const stats = {
        _count: { id: 10 },
        _sum: { actualDuration: 5000 },
      };

      mockDbService.studySession.findMany.mockResolvedValue(sessions);
      mockDbService.studySession.aggregate.mockResolvedValue(stats);

      const result = await service.getAll(userId);

      expect(result).toEqual({
        sessions,
        totalCount: 10,
        totalDuration: 5000,
      });

      expect(mockDbService.studySession.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          status: SessionStatusEnum.COMPLETED,
        },
        include: {
          subject: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: {
          startedAt: 'desc',
        },
        take: 100,
      });

      expect(mockDbService.studySession.aggregate).toHaveBeenCalledWith({
        where: {
          userId,
          status: SessionStatusEnum.COMPLETED,
        },
        _count: {
          id: true,
        },
        _sum: {
          actualDuration: true,
        },
      });
    });

    it('should handle null aggregated duration', async () => {
      const userId = 'user-1';
      const sessions = [];
      const stats = {
        _count: { id: 0 },
        _sum: { actualDuration: null },
      };

      mockDbService.studySession.findMany.mockResolvedValue(sessions);
      mockDbService.studySession.aggregate.mockResolvedValue(stats);

      const result = await service.getAll(userId);

      expect(result).toEqual({
        sessions: [],
        totalCount: 0,
        totalDuration: 0,
      });
    });
  });
});
