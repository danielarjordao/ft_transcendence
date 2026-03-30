export class NotificationDto {
  id: string;
  type: 'FRIEND_REQUEST' | 'WORKSPACE_INVITE' | 'TASK_ASSIGNED' | 'MENTION';
  content: string;
  isRead: boolean;
  createdAt: Date;
  relatedEntityId?: string;
}
