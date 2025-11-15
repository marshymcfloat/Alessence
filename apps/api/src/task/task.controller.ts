import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateTaskDTO } from '@repo/types/nest';
import { GetUser } from 'src/auth/decorator/get-user.decorator';
import type { AuthenticatedUser } from 'src/auth/decorator/get-user.decorator';
import { TaskService } from './task.service';
import {
  CreateNewTaskReturnType,
  GetAllTasksReturnType,
  UpdateTaskStatusReturnType,
} from '@repo/types';
import { TaskStatusEnum } from '@repo/db';
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

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  async updateTask(
    @Param('id') id: number,
    @Body() updateTaskDto: CreateTaskDTO,
    @GetUser() user: AuthenticatedUser,
  ): Promise<UpdateTaskStatusReturnType> {
    const updatedTask = await this.taskService.updateTask(+id, updateTaskDto);

    return { updatedTask, userId: user.userId };
  }
  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/status')
  async updateTaskStatus(
    @Param('id') id: number,
    @Query('status') status: TaskStatusEnum,
    @GetUser() user: AuthenticatedUser,
  ): Promise<UpdateTaskStatusReturnType> {
    const updatedTask = await this.taskService.updateTaskStatus(+id, status);

    return { updatedTask, userId: user.userId };
  }
}
