import { Injectable } from '@nestjs/common';
import { Task } from '@repo/db';
import { CreateTaskDTO } from '@repo/types/nest';
import { DbService } from 'src/db/db.service';

@Injectable()
export class TaskService {
  constructor(private readonly dbService: DbService) {}

  async getAll(): Promise<Task[]> {
    const allTasks = await this.dbService.task.findMany();

    return allTasks;
  }

  async create(createTaskDto: CreateTaskDTO): Promise<Task> {
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
      },
    });

    return newTask;
  }
}
