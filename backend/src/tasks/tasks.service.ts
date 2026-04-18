import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto';
import {
  Prisma,
  TaskPriority as PrismaTaskPriority,
} from '../generated/prisma/client';
import { TaskWithRelations } from './interfaces/task-relations.type';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  // Centralized security gatekeeper: Extracts the task and ensures the requesting user is a workspace member.
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

    if (!task) throw new NotFoundException('Task not found');

    if (task.workspace.members.length === 0) {
      throw new ForbiddenException('Access denied to this workspace');
    }

    return this.formatTaskResponse(task);
  }

  // Helper method used exclusively for internal mutations (Update/Delete) to avoid double-formatting.
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

  // Translates human-readable statuses (slugs) provided by the frontend into exact database Field UUIDs.
  private async getFieldIdByStatus(workspaceId: string, statusSlug: string) {
    const field = await this.prisma.field.findFirst({
      where: {
        workspaceId,
        OR: [
          { name: { equals: statusSlug, mode: 'insensitive' } },
          { id: statusSlug },
        ],
      },
    });

    if (!field) {
      throw new BadRequestException(
        `Status (Field) '${statusSlug}' not found in this workspace`,
      );
    }
    return field.id;
  }

  // Normalizes the complex Prisma object into the exact flat JSON contract expected by the React frontend.
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
          ? (dto.priority.toUpperCase() as PrismaTaskPriority)
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

    // TODO: [Feature - WebSockets] Emit 'task_created' event to the 'workspace:{wsId}' room to update Kanban boards in real-time.

    return this.formatTaskResponse(newTask);
  }

  async findAll(userId: string, wsId: string, query: ListTasksQueryDto) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: wsId, userId } },
    });

    if (!membership) throw new ForbiddenException('Access denied');

    const {
      limit = 20,
      offset = 0,
      search,
      priority,
      subject,
      assignee,
      status,
    } = query;

    // Dynamically construct the query filter based on provided parameters.
    const whereClause: Prisma.TaskWhereInput = {
      workspaceId: wsId,
      title: search ? { contains: search, mode: 'insensitive' } : undefined,
      priority: priority
        ? (priority.toUpperCase() as PrismaTaskPriority)
        : undefined,
      subjectId: subject,
      assigneeId: assignee,
      fieldId: status ? await this.getFieldIdByStatus(wsId, status) : undefined,
    };

    // Execute count and fetch operations atomically for accurate pagination metadata.
    const [total, items] = await this.prisma.$transaction([
      this.prisma.task.count({ where: whereClause }),
      this.prisma.task.findMany({
        where: whereClause,
        take: Number(limit),
        skip: Number(offset),
        orderBy: { createdAt: 'desc' },
        include: {
          field: true,
          subject: true,
          assignee: { include: { user: true } },
          _count: { select: { attachments: true, comments: true } },
        },
      }),
    ]);

    return {
      items: items.map((task) => this.formatTaskResponse(task)),
      pageInfo: {
        limit: Number(limit),
        offset: Number(offset),
        total,
        hasMore: Number(offset) + Number(limit) < total,
      },
    };
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
          ? (dto.priority.toUpperCase() as PrismaTaskPriority)
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

    // TODO: [Feature - WebSockets] Emit 'task_updated' event to 'workspace:{existingTask.workspaceId}'.
    // TODO: [Feature - WebSockets] If 'newFieldId' differs from 'existingTask.fieldId', emit a specific 'task_moved' event to trigger drag-and-drop animations on client boards.

    return this.formatTaskResponse(updatedTask);
  }

  async remove(userId: string, taskId: string) {
    const _task = await this.getTaskAndCheckAccess(userId, taskId);
    await this.prisma.task.delete({ where: { id: taskId } });

    // TODO: [Feature - WebSockets] Emit 'task_deleted' event to 'workspace:{task.workspaceId}'.
  }
}
