import { Test, TestingModule } from '@nestjs/testing';
import { SubjectService } from './subject.service';
import { DbService } from '../db/db.service';
import { GeminiService } from '../gemini/gemini.service';
import { TaskStatusEnum } from '@repo/db';

const mockSubjects = [
  { id: 1, title: 'Math', userId: 'user1', isEnrolled: true },
  { id: 2, title: 'Science', userId: 'user1', isEnrolled: true },
];

const mockTasks = [
  { id: 101, subjectId: 1, status: TaskStatusEnum.DONE, userId: 'user1' },
  { id: 102, subjectId: 1, status: TaskStatusEnum.DONE, userId: 'user1' },
  { id: 103, subjectId: 1, status: TaskStatusEnum.PLANNED, userId: 'user1' },
  {
    id: 201,
    subjectId: 2,
    status: TaskStatusEnum.ON_PROGRESS,
    userId: 'user1',
  },
];

const mockDbService = {
  subject: {
    findMany: jest.fn().mockImplementation((args: any) => {
      // Logic to simulate include: tasks
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (args?.include?.tasks) {
        return Promise.resolve(
          mockSubjects.map((s) => ({
            ...s,
            tasks: mockTasks
              .filter((t) => t.subjectId === s.id)
              .map((t) => ({ status: t.status })),
          })),
        );
      }
      return Promise.resolve(mockSubjects);
    }),
  },
  task: {
    groupBy: jest.fn().mockImplementation(() => {
      // Logic to simulate groupBy
      // args: { by: ['subjectId', 'status'], where: { ... }, _count: { _all: true } }

      const groups: Record<string, any> = {};
      mockTasks.forEach((t) => {
        const key = `${t.subjectId}-${t.status}`;
        if (!groups[key])
          groups[key] = {
            subjectId: t.subjectId,
            status: t.status,
            _count: { _all: 0 },
          };
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        groups[key]._count._all++;
      });
      return Promise.resolve(Object.values(groups));
    }),
  },
};

const mockGeminiService = {};

describe('SubjectService Optimization', () => {
  let service: SubjectService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubjectService,
        { provide: DbService, useValue: mockDbService },
        { provide: GeminiService, useValue: mockGeminiService },
      ],
    }).compile();

    service = module.get<SubjectService>(SubjectService);

    jest.clearAllMocks();
  });

  it('should return subjects with correct task counts', async () => {
    const result = await service.getAll('user1');

    expect(result).toHaveLength(2);

    const math = result.find((s) => s.id === 1);
    expect(math).toBeDefined();
    expect(math!.taskCounts).toEqual({
      total: 3,
      done: 2,
      onProgress: 0,
      planned: 1,
    });

    const science = result.find((s) => s.id === 2);
    expect(science).toBeDefined();
    expect(science!.taskCounts).toEqual({
      total: 1,
      done: 0,
      onProgress: 1,
      planned: 0,
    });
  });
});
