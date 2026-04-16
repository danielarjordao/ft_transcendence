import { Prisma } from '../../generated/prisma/client';

export type TaskWithRelations = Prisma.TaskGetPayload<{
  include: {
    field: true;
    subject: true;
    assignee: { include: { user: true } };
    _count: { select: { attachments: true; comments: true } };
  };
}>;
