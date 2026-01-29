import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { DbService } from '../db/db.service';

describe('SearchService', () => {
  let service: SearchService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let dbService: DbService;

  const mockDbService = {
    note: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 1,
          title: 'Note 1',
          content: 'Content 1',
          subject: { id: 1, title: 'Math' },
        },
      ]),
    },
    task: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 1,
          title: 'Task 1',
          description: 'Desc 1',
          status: 'PLANNED',
          deadline: new Date(),
          subject: { id: 1, title: 'Math' },
        },
      ]),
    },
    file: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 1,
          name: 'File 1',
          type: 'PDF',
          subject: { id: 1, title: 'Math' },
        },
      ]),
    },
    exam: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 1,
          description: 'Exam 1',
          status: 'READY',
          subject: { id: 1, title: 'Math' },
        },
      ]),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: DbService,
          useValue: mockDbService,
        },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    dbService = module.get<DbService>(DbService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return combined search results', async () => {
    const userId = 'user-1';
    const query = 'test';

    const results = await service.searchAll(userId, query);

    expect(results).toHaveLength(4);

    // Check types
    const types = results.map((r) => r.type);
    expect(types).toContain('note');
    expect(types).toContain('task');
    expect(types).toContain('file');
    expect(types).toContain('exam');

    // Verify calls
    expect(mockDbService.note.findMany).toHaveBeenCalled();
    expect(mockDbService.task.findMany).toHaveBeenCalled();
    expect(mockDbService.file.findMany).toHaveBeenCalled();
    expect(mockDbService.exam.findMany).toHaveBeenCalled();
  });

  it('should return empty array for empty query', async () => {
    const results = await service.searchAll('user-1', '');
    expect(results).toEqual([]);
  });
});
