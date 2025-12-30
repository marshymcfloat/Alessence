import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Subject, TaskStatusEnum, Topic } from '@repo/db';
import { SubjectWithTaskProgress } from '@repo/types';
import { CreateSubjectDTO, CreateTopicDTO } from '@repo/types/nest';
import { capitalizeString } from '@repo/utils';
import { DbService } from 'src/db/db.service';
import { GeminiService } from 'src/gemini/gemini.service';

@Injectable()
export class SubjectService {
  constructor(
    private readonly dbService: DbService,
    private readonly geminiService: GeminiService,
  ) {}

  async getAll(userId: string): Promise<SubjectWithTaskProgress[]> {
    const subjectsWithTasks = await this.dbService.subject.findMany({
      where: {
        isEnrolled: true,
        userId: userId, // Only return subjects owned by this user
      },

      include: {
        tasks: {
          where: {
            userId: userId, // Only include tasks owned by this user
          },
          select: {
            status: true,
          },
        },
      },
    });

    const subjectsWithProgress = subjectsWithTasks.map((subject) => {
      const { tasks, ...restOfSubject } = subject;

      const taskCounts = {
        total: tasks.length,
        done: tasks.filter((task) => task.status === TaskStatusEnum.DONE)
          .length,
        onProgress: tasks.filter(
          (task) => task.status === TaskStatusEnum.ON_PROGRESS,
        ).length,
        planned: tasks.filter((task) => task.status === TaskStatusEnum.PLANNED)
          .length,
      };

      return {
        ...restOfSubject,
        taskCounts,
      };
    });

    return subjectsWithProgress;
  }

  async getSystemSyllabus(): Promise<Subject[]> {
    return this.dbService.subject.findMany({
      where: {
        userId: null,
      },
      orderBy: {
        id: 'asc',
      },
    });
  }

  /**
   * Forks a system subject to a user's private collection
   */
  async forkSubject(subjectId: number, userId: string): Promise<Subject> {
    const systemSubject = await this.dbService.subject.findUnique({
      where: { id: subjectId },
    });

    if (!systemSubject) {
      throw new NotFoundException('Subject not found');
    }

    if (systemSubject.userId !== null) {
      throw new BadRequestException('Cannot fork a private subject');
    }

    // Check if already forked (by title)
    const existingFork = await this.dbService.subject.findFirst({
      where: {
        userId,
        title: systemSubject.title,
      },
    });

    if (existingFork) {
      return existingFork;
    }

    // Clone Subject
    const newSubject = await this.dbService.subject.create({
      data: {
        title: systemSubject.title,
        description: systemSubject.description,
        sem: systemSubject.sem,
        userId: userId,
        isEnrolled: true,
      },
    });

    // Clone Topics Recursively
    const systemTopics = await this.dbService.topic.findMany({
      where: { subjectId: systemSubject.id },
      orderBy: { order: 'asc' },
    });

    const topicMap = new Map<number, number>(); // OldID -> NewID

    // First pass: Create roots
    const rootTopics = systemTopics.filter((t) => t.parentId === null);
    
    // Helper to clone a topic and its children
    const cloneTopicTree = async (originalTopic: Topic, newParentId: number | null) => {
      const newTopic = await this.dbService.topic.create({
        data: {
          title: originalTopic.title,
          order: originalTopic.order,
          subjectId: newSubject.id,
          parentId: newParentId,
        },
      });
      
      topicMap.set(originalTopic.id, newTopic.id);

      // Find children
      const children = systemTopics.filter(t => t.parentId === originalTopic.id);
      for (const child of children) {
        await cloneTopicTree(child, newTopic.id);
      }
    };

    for (const root of rootTopics) {
      await cloneTopicTree(root, null);
    }

    return newSubject;
  }

  async create(
    createSubjectDTO: CreateSubjectDTO,
    userId: string,
  ): Promise<Subject> {
    const { title, description, semester } = createSubjectDTO;
    try {
      const capitalizeTitle = capitalizeString(title);

      if (!capitalizeTitle) {
        throw new BadRequestException('Please pass a valid subject title');
      }

      const newSubject = await this.dbService.subject.create({
        data: {
          title: capitalizeTitle,
          description,
          sem: semester,
          userId: userId, // Set user ownership
        },
      });

      if (!newSubject) {
        throw new BadRequestException();
      }

      return newSubject;
    } catch (error) {
      console.error(
        'There is unexpected error occured while attempting to create new subject',
      );
      throw new Error(
        'There is unpxected error occured while attempting to create new subject',
      );
    }
  }

  async delete(id: number, userId: string): Promise<void> {
    try {
      const subject = await this.dbService.subject.findFirst({
        where: { id, userId }, // Verify ownership
      });

      if (!subject) {
        throw new BadRequestException(
          'Subject not found or you do not have permission to delete it.',
        );
      }

      await this.dbService.subject.delete({
        where: { id },
      });
    } catch (error) {
      console.error(
        'There is unexpected error occured while attempting to delete subject',
        error,
      );
      throw new BadRequestException(
        'There is unexpected error occured while attempting to delete subject',
      );
    }
  }

  // --- Topic Hierarchy (Syllabus Map) ---

  async createTopic(dto: CreateTopicDTO): Promise<Topic> {
    // Verify subject ownership
    const subject = await this.dbService.subject.findUnique({
      where: { id: dto.subjectId },
    });

    if (!subject) throw new NotFoundException('Subject not found');
    if (subject.userId === null) {
      throw new BadRequestException('Cannot directly edit system subjects. Please customize (fork) it first.');
    }

    return this.dbService.topic.create({
      data: {
        title: dto.title,
        subjectId: dto.subjectId,
        parentId: dto.parentId,
        order: dto.order,
      },
    });
  }

  async getTopics(subjectId: number) {
    const topics = await this.dbService.topic.findMany({
      where: { subjectId },
      orderBy: { order: 'asc' },
    });
    return this.buildTopicTree(topics);
  }

  async deleteTopic(id: number) {
    const topic = await this.dbService.topic.findUnique({
      where: { id },
      include: { subject: true },
    });

    if (!topic) throw new NotFoundException('Topic not found');
    if (topic.subject.userId === null) {
      throw new BadRequestException('Cannot delete topics from system subjects. Please customize (fork) it first.');
    }

    return this.dbService.topic.delete({
      where: { id },
    });
  }

  async generateSubTopics(parentTopicId: number): Promise<Topic[]> {
    const parentTopic = await this.dbService.topic.findUnique({
      where: { id: parentTopicId },
      include: { subject: true },
    });

    if (!parentTopic) {
      throw new NotFoundException('Parent topic not found');
    }

    if (parentTopic.subject.userId === null) {
      throw new BadRequestException('Cannot generate topics for system subjects. Please customize (fork) it first.');
    }

    const subTopics = await this.geminiService.generateSubTopics(
      parentTopic.title,
      parentTopic.subject.title,
    );

    const createdTopics: Topic[] = [];

    // Get current max order
    const maxOrder = await this.dbService.topic.findFirst({
      where: { parentId: parentTopicId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    let currentOrder = (maxOrder?.order || 0) + 1;

    for (const title of subTopics) {
      const topic = await this.dbService.topic.create({
        data: {
          title,
          subjectId: parentTopic.subjectId,
          parentId: parentTopicId,
          order: currentOrder++,
        },
      });
      createdTopics.push(topic);
    }

    return createdTopics;
  }

  private buildTopicTree(topics: any[]) {
    const map = new Map();
    const roots: any[] = [];
    topics.forEach((t) => {
      map.set(t.id, { ...t, children: [] });
    });
    topics.forEach((t) => {
      if (t.parentId) {
        if (map.has(t.parentId)) {
          map.get(t.parentId).children.push(map.get(t.id));
        }
      } else {
        roots.push(map.get(t.id));
      }
    });
    return roots;
  }
}
