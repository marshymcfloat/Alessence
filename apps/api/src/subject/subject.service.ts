import { BadRequestException, Injectable } from '@nestjs/common';
import { Subject, TaskStatusEnum } from '@repo/db';
import { SubjectWithTaskProgress } from '@repo/types';
import { CreateSubjectDTO } from '@repo/types/nest';
import { capitalizeString } from '@repo/utils';
import { DbService } from 'src/db/db.service';

@Injectable()
export class SubjectService {
  constructor(private readonly dbService: DbService) {}

  async getAll(): Promise<SubjectWithTaskProgress[]> {
    const subjectsWithTasks = await this.dbService.subject.findMany({
      where: { isEnrolled: true },
      // Include the status of all related tasks
      include: {
        tasks: {
          select: {
            status: true,
          },
        },
      },
    });

    // Process the data to add counts
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
  async create(createSubjectDTO: CreateSubjectDTO): Promise<Subject> {
    const { title, description, semester } = createSubjectDTO;
    try {
      const capitalizeTitle = capitalizeString(title);

      if (!capitalizeTitle) {
        throw new BadRequestException('Please pass a valid subject title');
      }

      const newSubject = await this.dbService.subject.create({
        data: { title: capitalizeTitle, description, sem: semester },
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
}
