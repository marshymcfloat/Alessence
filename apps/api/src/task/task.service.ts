import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Task, TaskStatusEnum } from '@repo/db';
import { CreateTaskDTO } from '@repo/types/nest';
import { DbService } from 'src/db/db.service';

@Injectable()
export class TaskService {
  constructor(private readonly dbService: DbService) {}

  async getAll(userId: string): Promise<Task[]> {
    const allTasks = await this.dbService.task.findMany({
      where: {
        userId: userId, // Only return tasks owned by this user
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
        deadline: 'asc',
      },
    });

    return allTasks;
  }

  async create(createTaskDto: CreateTaskDTO, userId: string): Promise<Task> {
    const { deadline, status, title, description, subject } = createTaskDto;

    const newDescription = description || '';
    const subjectId = subject ?? null;

    const newTask = await this.dbService.task.create({
      data: {
        title,
        description: newDescription,
        deadline,
        status,
        subjectId: subjectId,
        userId: userId, // Set user ownership
      },
    });

    return newTask;
  }

  async updateTaskStatus(
    id: number,
    status: TaskStatusEnum,
    userId: string,
  ): Promise<Task> {
    try {
      // Verify ownership
      const task = await this.dbService.task.findFirst({
        where: { id, userId },
      });

      if (!task) {
        throw new BadRequestException(
          'Task not found or you do not have permission to update it.',
        );
      }

      const updatedTask = await this.dbService.task.update({
        where: { id },
        data: { status },
      });

      return updatedTask;
    } catch (error) {
      console.error(
        'There is an error while attempting to update task status',
        error,
      );
      throw new BadRequestException(
        'There is an en error occured while attempting to update task status',
      );
    }
  }

  async updateTask(
    id: number,
    updateTaskDto: CreateTaskDTO,
    userId: string,
  ): Promise<Task> {
    const { deadline, status, title, description, subject } = updateTaskDto;

    if (!updateTaskDto) {
      throw new BadRequestException();
    }

    try {
      // Verify ownership
      const task = await this.dbService.task.findFirst({
        where: { id, userId },
      });

      if (!task) {
        throw new BadRequestException(
          'Task not found or you do not have permission to update it.',
        );
      }

      const updatedTask = await this.dbService.task.update({
        where: { id },
        data: { deadline, status, title, description, subjectId: subject },
      });

      return updatedTask;
    } catch (error) {
      console.error(
        'There is an error while attempting to update task status',
        error,
      );
      throw new Error(
        'There is an error while attempting to update task status',
      );
    }
  }

  async deleteTask(id: number, userId: string): Promise<void> {
    try {
      // Verify ownership
      const task = await this.dbService.task.findFirst({
        where: { id, userId },
      });

      if (!task) {
        throw new BadRequestException(
          'Task not found or you do not have permission to delete it.',
        );
      }

      await this.dbService.task.delete({
        where: { id },
      });
    } catch (error) {
      console.error('There is an error while attempting to delete task', error);
      throw new BadRequestException(
        'There is an error while attempting to delete task',
      );
    }
  }
}
