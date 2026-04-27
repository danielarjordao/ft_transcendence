import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, TaskPriority } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto';
import { TaskWithRelations } from './interfaces/task-relations.type';
import { createPaginatedResponse } from '../common/utils/pagination.util';
import { AppGateway } from 'src/realtime/app.gateway';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly appGateway: AppGateway,
  ) {}

  // Architectural Focus: Centralized security gatekeeper.
  // Extracts the task and ensures the requesting user is a workspace member in a single query.
  async findOne(userId: string, taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        workspace: { include: { members: { where: { userId } } } },
        field: true,
        subject: true,
        assignee: { include: { user: true } },
        _count: { select: { attachments: true, comments: true } },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.workspace.members.length === 0) {
      throw new ForbiddenException('Access denied to this workspace');
    }

    return this.formatTaskResponse(task);
  }

  // Architectural Focus: Internal helper for mutations (Update/Delete) to avoid double-formatting.
  private async getTaskAndCheckAccess(userId: string, taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { workspace: { include: { members: { where: { userId } } } } },
    });

    if (!task) throw new NotFoundException('Task not found');
    if (task.workspace.members.length === 0)
      throw new ForbiddenException('Access denied');

    return task;
  }

  // Architectural Focus: Safe translation of Frontend Slugs to Database UUIDs.
  private async getFieldIdByStatus(workspaceId: string, statusSlug: string) {
    const fields = await this.prisma.field.findMany({
      where: { workspaceId },
      select: { id: true, name: true },
    });

    const matchedField = fields.find(
      (f) => f.name.toLowerCase().replace(/\s+/g, '_') === statusSlug,
    );

    if (!matchedField) {
      throw new BadRequestException(
        `Status (Field) '${statusSlug}' not found in this workspace`,
      );
    }
    return matchedField.id;
  }

  // Architectural Focus: Normalizes the complex Prisma object into the exact flat JSON contract.
  private formatTaskResponse(task: TaskWithRelations) {
    return {
      id: task.id,
      workspaceId: task.workspaceId,
      title: task.title,
      description: task.description,
      priority: task.priority?.toLowerCase() || 'medium',
      status: task.field?.name?.toLowerCase().replace(/\s+/g, '_') || 'unknown',
      subject: task.subject
        ? {
            id: task.subject.id,
            name: task.subject.name,
            color: task.subject.color,
          }
        : null,
      assignee: task.assignee
        ? {
            id: task.assignee.userId,
            username: task.assignee.user?.username,
            fullName: task.assignee.user?.fullName,
            avatarUrl: task.assignee.user?.avatarUrl,
          }
        : null,
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      attachmentCount: task._count?.attachments || 0,
      commentsCount: task._count?.comments || 0,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };
  }

  async create(userId: string, wsId: string, dto: CreateTaskDto) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: wsId, userId } },
    });

    if (!membership) {
      throw new ForbiddenException('You must be a member to create tasks');
    }

    const fieldId = await this.getFieldIdByStatus(wsId, dto.status);

    const newTask = await this.prisma.task.create({
      data: {
        workspaceId: wsId,
        createdById: userId,
        title: dto.title,
        description: dto.description,
        fieldId: fieldId,
        subjectId: dto.subjectId,
        assigneeId: dto.assigneeId,
        priority: dto.priority
          ? (dto.priority.toUpperCase() as TaskPriority)
          : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      },
      include: {
        field: true,
        subject: true,
        assignee: { include: { user: true } },
        _count: { select: { attachments: true, comments: true } },
      },
    });

    const formattedTask = this.formatTaskResponse(newTask);

    // Broadcast the creation to everyone in the workspace
    this.appGateway.server
      .to(`workspace:${wsId}`)
      .emit('task_created', formattedTask);

    return formattedTask;
  }

  async findAll(userId: string, wsId: string, query: ListTasksQueryDto) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: wsId, userId } },
    });

    if (!membership) throw new ForbiddenException('Access denied');

    const limit = query.limit ? Number(query.limit) : 20;
    const offset = query.offset ? Number(query.offset) : 0;

    // Architectural Focus: Safe dynamic initialization of the whereClause to prevent ESLint errors.
    const whereClause: Prisma.TaskWhereInput = {
      workspaceId: wsId,
    };

    if (query.search) {
      whereClause.title = { contains: query.search, mode: 'insensitive' };
    }
    if (query.priority) {
      whereClause.priority = query.priority.toUpperCase() as TaskPriority;
    }
    if (query.subject) {
      whereClause.subjectId = query.subject;
    }
    if (query.assignee) {
      whereClause.assigneeId = query.assignee;
    }
    if (query.status) {
      whereClause.fieldId = await this.getFieldIdByStatus(wsId, query.status);
    }
    if (query.dueFrom || query.dueTo) {
      whereClause.dueDate = {};
      if (query.dueFrom) {
        whereClause.dueDate.gte = new Date(query.dueFrom);
      }
      if (query.dueTo) {
        whereClause.dueDate.lte = new Date(query.dueTo);
      }
    }

    // Dynamic Sorting Logic
    let orderByClause: Prisma.TaskOrderByWithRelationInput = {
      createdAt: 'desc',
    };
    if (query.sortBy) {
      const direction =
        String(query.sortOrder).toLowerCase() === 'desc' ? 'desc' : 'asc';
      switch (query.sortBy) {
        case 'dueDate':
          orderByClause = { dueDate: direction };
          break;
        case 'title':
          orderByClause = { title: direction };
          break;
        case 'priority':
          orderByClause = { priority: direction };
          break;
        case 'createdAt':
          orderByClause = { createdAt: direction };
          break;
      }
    }

    // Atomic Fetch & Count
    const [total, items] = await this.prisma.$transaction([
      this.prisma.task.count({ where: whereClause }),
      this.prisma.task.findMany({
        where: whereClause,
        take: limit,
        skip: offset,
        orderBy: orderByClause,
        include: {
          field: true,
          subject: true,
          assignee: { include: { user: true } },
          _count: { select: { attachments: true, comments: true } },
        },
      }),
    ]);

    const formattedItems = items.map((task) => this.formatTaskResponse(task));

    return createPaginatedResponse(formattedItems, total, limit, offset);
  }

  async update(userId: string, taskId: string, dto: UpdateTaskDto) {
    const existingTask = await this.getTaskAndCheckAccess(userId, taskId);

    let newFieldId: string | undefined;
    if (dto.status) {
      newFieldId = await this.getFieldIdByStatus(
        existingTask.workspaceId,
        dto.status,
      );
    }

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        title: dto.title,
        description: dto.description,
        fieldId: newFieldId,
        subjectId: dto.subjectId,
        assigneeId: dto.assigneeId,
        priority: dto.priority
          ? (dto.priority.toUpperCase() as TaskPriority)
          : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      include: {
        field: true,
        subject: true,
        assignee: { include: { user: true } },
        _count: { select: { attachments: true, comments: true } },
      },
    });

    const formattedUpdatedTask = this.formatTaskResponse(updatedTask);

    // Broadcast generic update
    this.appGateway.server
      .to(`workspace:${existingTask.workspaceId}`)
      .emit('task_updated', formattedUpdatedTask);

    // Smart Event: Detect Drag & Drop between columns
    if (newFieldId && newFieldId !== existingTask.fieldId) {
      this.appGateway.server
        .to(`workspace:${existingTask.workspaceId}`)
        .emit('task_moved', {
          taskId: updatedTask.id,
          oldFieldId: existingTask.fieldId,
          newFieldId: newFieldId,
          task: formattedUpdatedTask,
        });
    }

    return formattedUpdatedTask;
  }

  async remove(userId: string, taskId: string) {
    const _task = await this.getTaskAndCheckAccess(userId, taskId);
    await this.prisma.task.delete({ where: { id: taskId } });

    // Notify clients to remove the task from their UI
    this.appGateway.server
      .to(`workspace:${_task.workspaceId}`)
      .emit('task_deleted', { id: taskId });
  }
}
