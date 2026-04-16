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
import { Prisma } from '../generated/prisma/client';
import { TaskWithRelations } from './interfaces/task-relations.type';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

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

  private formatTaskResponse(task: TaskWithRelations) {
    return {
      id: task.id,
      workspaceId: task.workspaceId,
      title: task.title,
      description: task.description,
      priority: task.priority,
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
    if (!membership)
      throw new ForbiddenException('You must be a member to create tasks');

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
        priority: dto.priority,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      },
      include: {
        field: true,
        subject: true,
        assignee: { include: { user: true } },
        _count: { select: { attachments: true, comments: true } },
      },
    });

    // TODO: Emitir WS event 'task_created' para 'workspace:{wsId}'

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

    const whereClause: Prisma.TaskWhereInput = {
      workspaceId: wsId,
      title: search ? { contains: search, mode: 'insensitive' } : undefined,
      priority: priority,
      subjectId: subject,
      assigneeId: assignee,
      fieldId: status ? await this.getFieldIdByStatus(wsId, status) : undefined,
    };

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
    if (task.workspace.members.length === 0)
      throw new ForbiddenException('Access denied');

    return this.formatTaskResponse(task);
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
        priority: dto.priority,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      include: {
        field: true,
        subject: true,
        assignee: { include: { user: true } },
        _count: { select: { attachments: true, comments: true } },
      },
    });

    // TODO: Emitir WS event 'task_updated' para 'workspace:{wsId}'
    // TODO: Emitir WS event 'task_moved' se mudou de coluna

    return this.formatTaskResponse(updatedTask);
  }

  async remove(userId: string, taskId: string) {
    await this.getTaskAndCheckAccess(userId, taskId);
    await this.prisma.task.delete({ where: { id: taskId } });
    // TODO: Emitir WS event 'task_deleted' para 'workspace:{wsId}'
  }
}
