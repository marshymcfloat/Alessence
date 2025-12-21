import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';

export interface SearchResult {
  type: 'note' | 'task' | 'file' | 'exam';
  id: number;
  title: string;
  content?: string;
  metadata?: any;
}

@Injectable()
export class SearchService {
  constructor(private readonly dbService: DbService) {}

  async searchAll(userId: string, query: string): Promise<SearchResult[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const searchTerm = query.trim();
    const results: SearchResult[] = [];

    // Search Notes
    const notes = await this.dbService.note.findMany({
      where: {
        userId,
        OR: [
          {
            title: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
          {
            content: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        content: true,
        subject: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      take: 10,
    });

    results.push(
      ...notes.map((note) => ({
        type: 'note' as const,
        id: note.id,
        title: note.title,
        content: note.content?.substring(0, 200),
        metadata: {
          subject: note.subject,
        },
      })),
    );

    // Search Tasks
    const tasks = await this.dbService.task.findMany({
      where: {
        OR: [
          {
            title: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        deadline: true,
        subject: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      take: 10,
    });

    results.push(
      ...tasks.map((task) => ({
        type: 'task' as const,
        id: task.id,
        title: task.title,
        content: task.description,
        metadata: {
          status: task.status,
          deadline: task.deadline,
          subject: task.subject,
        },
      })),
    );

    // Search Files
    const files = await this.dbService.file.findMany({
      where: {
        name: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        name: true,
        type: true,
        subject: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      take: 10,
    });

    results.push(
      ...files.map((file) => ({
        type: 'file' as const,
        id: file.id,
        title: file.name,
        metadata: {
          type: file.type,
          subject: file.subject,
        },
      })),
    );

    // Search Exams
    const exams = await this.dbService.exam.findMany({
      where: {
        description: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        description: true,
        status: true,
        subject: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      take: 10,
    });

    results.push(
      ...exams.map((exam) => ({
        type: 'exam' as const,
        id: exam.id,
        title: exam.description,
        metadata: {
          status: exam.status,
          subject: exam.subject,
        },
      })),
    );

    return results;
  }
}

