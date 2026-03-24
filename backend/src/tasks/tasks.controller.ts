import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto';

@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // POST /workspaces/:wsId/tasks (API 5.2)
  @Post('workspaces/:wsId/tasks')
  create(@Param('wsId') wsId: string, @Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(wsId, createTaskDto);
  }

  // GET /workspaces/:wsId/tasks (API 5.1)
  @Get('workspaces/:wsId/tasks')
  findAll(@Param('wsId') wsId: string, @Query() query: ListTasksQueryDto) {
    return this.tasksService.findAll(wsId, query);
  }

  // GET /tasks/:taskId (API 5.3)
  @Get('tasks/:taskId')
  findOne(@Param('taskId') taskId: string) {
    return this.tasksService.findOne(taskId);
  }

  // PATCH /tasks/:taskId (API 5.4)
  @Patch('tasks/:taskId')
  update(
    @Param('taskId') taskId: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.update(taskId, updateTaskDto);
  }

  // DELETE /tasks/:taskId (API 5.5)
  @Delete('tasks/:taskId')
  @HttpCode(204)
  remove(@Param('taskId') taskId: string) {
    return this.tasksService.remove(taskId);
  }
}
