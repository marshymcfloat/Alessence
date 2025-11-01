import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateTaskDTO } from '@repo/types/nest';
import { GetUser } from 'src/auth/decorator/get-user.decorator';
import type { AuthenticatedUser } from 'src/auth/decorator/get-user.decorator';
import { TaskService } from './task.service';
import { CreateNewTaskReturnType, GetAllTasksReturnType } from '@repo/types';
@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getAll(
    @GetUser() user: AuthenticatedUser,
  ): Promise<GetAllTasksReturnType> {
    const allTasks = await this.taskService.getAll();

    return { allTasks, userId: user.userId };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(
    @Body() createTaskDto: CreateTaskDTO,
    @GetUser() user: AuthenticatedUser,
  ): Promise<CreateNewTaskReturnType> {
    const newTask = await this.taskService.create(createTaskDto);

    return { newTask, userId: user.userId };
  }
}
