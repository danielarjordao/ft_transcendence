import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto';

type MockTask = {
  id: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
};

@Injectable()
export class TasksService {
  private tasks: MockTask[] = [];

  create(wsId: string, createTaskDto: CreateTaskDto) {
    // TODO: Replace with Prisma create — verify caller is workspace member.
    // TODO: Emit WS event 'task_created' to 'workspace:{wsId}'.
    const newTask: MockTask = {
      id: `tsk_${Date.now()}`,
      workspaceId: wsId,
      ...createTaskDto,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.tasks.push(newTask);
    return newTask;
  }

  findAll(wsId: string, query: ListTasksQueryDto) {
    // TODO: Replace with Prisma findMany — filter by workspaceId + optional query params + pagination.
    const items = this.tasks.filter((t) => t.workspaceId === wsId);
    return {
      items,
      pageInfo: {
        limit: Number(query.limit) || 20,
        offset: Number(query.offset) || 0,
        total: items.length,
        hasMore: false,
      },
    };
  }

  findOne(taskId: string) {
    // TODO: Replace with Prisma findUnique — verify caller is workspace member (throw 403 if not).
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) throw new NotFoundException(`Task with ID ${taskId} not found`);
    return task;
  }

  update(taskId: string, updateTaskDto: UpdateTaskDto) {
    // TODO: Replace with Prisma update — verify caller is workspace member.
    // TODO: Emit WS event 'task_updated' to 'workspace:{wsId}'.
    // TODO: If 'status' is changed, emit WS event 'task_moved' to 'workspace:{wsId}'.

    const task = this.findOne(taskId);
    Object.assign(task, updateTaskDto, { updatedAt: new Date().toISOString() });
    return task;
  }

  remove(taskId: string) {
    // TODO: Replace with Prisma delete — verify caller is workspace member.
    // TODO: Emit WS event 'task_deleted' to 'workspace:{wsId}'.
    const index = this.tasks.findIndex((t) => t.id === taskId);
    if (index === -1)
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    this.tasks.splice(index, 1);
  }
}
