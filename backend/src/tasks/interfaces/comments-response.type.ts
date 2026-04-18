import { Prisma } from '../../generated/prisma/client';

export type CommentWithAuthor = Prisma.CommentGetPayload<{
  include: {
    author: { select: { id: true; username: true; avatarUrl: true } };
  };
}>;
