import { BadRequestException, Injectable } from '@nestjs/common';
import { Subject, TaskStatusEnum } from '@repo/db';
import { SubjectWithTaskProgress } from '@repo/types';
import { CreateSubjectDTO } from '@repo/types/nest';
import { capitalizeString } from '@repo/utils';
import { DbService } from 'src/db/db.service';

@Injectable()
export class SubjectService {
  constructor(private readonly dbService: DbService) {}

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
}
