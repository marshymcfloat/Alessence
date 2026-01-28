import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { DbService } from '../db/db.service';
import { AttemptStatusEnum } from '@repo/db';

jest.mock(
  '@repo/db',
  () => {
    return {
      PrismaClient: class {},
      AttemptStatusEnum: { COMPLETED: 'COMPLETED' },
      SessionStatusEnum: {},
      TaskStatusEnum: {},
    };
  },
  { virtual: true },
);

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let dbService: DbService;

  const mockDbService = {
    examAttempt: {
      findMany: jest.fn(),
    },
    studySession: {
      findMany: jest.fn(),
    },
    task: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: DbService,
          useValue: mockDbService,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    dbService = module.get<DbService>(DbService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getExamScoreTrends', () => {
    it('should return exam score trends', async () => {
      const mockAttempts = [
        {
          score: 85,
          completedAt: new Date('2024-01-01'),
          exam: {
            id: 1,
            description: 'Test Exam',
            subject: {
              id: 101,
              title: 'Math',
            },
          },
        },
      ];
      mockDbService.examAttempt.findMany.mockResolvedValue(mockAttempts);

      const result = await service.getExamScoreTrends('user1');
      expect(result).toEqual([
        {
          date: '2024-01-01',
          score: 85,
          examId: 1,
          examDescription: 'Test Exam',
          subjectId: 101,
          subjectTitle: 'Math',
        },
      ]);
      expect(mockDbService.examAttempt.findMany).toHaveBeenCalled();
    });
  });

  describe('getSubjectPerformance', () => {
    it('should return subject performance', async () => {
      const mockAttempts = [
        {
          score: 80,
          exam: {
            id: 1,
            subject: {
              id: 101,
              title: 'Math',
            },
          },
        },
        {
          score: 90,
          exam: {
            id: 2,
            subject: {
              id: 101,
              title: 'Math',
            },
          },
        },
      ];
      mockDbService.examAttempt.findMany.mockResolvedValue(mockAttempts);

      const result = await service.getSubjectPerformance('user1');
      expect(result).toEqual([
        {
          subjectId: 101,
          subjectTitle: 'Math',
          averageScore: 85,
          totalExams: 2,
          totalAttempts: 2,
          bestScore: 90,
          worstScore: 80,
        },
      ]);
    });
  });
});
