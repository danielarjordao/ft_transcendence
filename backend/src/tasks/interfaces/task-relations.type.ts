import { Prisma } from '../../generated/prisma/client';

// This exported type leverages Prisma's type inference.
// It guarantees that our formatting methods expect exactly the relations we queried.
export type TaskWithRelations = Prisma.TaskGetPayload<{
  include: {
    field: true;
    subject: true;
    assignee: { include: { user: true } };
    _count: { select: { attachments: true; comments: true } };
  };
}>;
