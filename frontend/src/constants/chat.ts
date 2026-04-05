import type { Conversation } from '../types/chat';

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    friendId: '2',
    friendName: 'Sarah Chen',
    friendAvatar: undefined,
    isOnline: true,
    lastMessage: 'Sounds good! I will update the board...',
    lastMessageTime: '2m ago',
    unreadCount: 3,
  },
  {
    id: '2',
    friendId: '3',
    friendName: 'Marcus Johnson',
    friendAvatar: undefined,
    isOnline: true,
    lastMessage: 'Can you review the designs when you...',
    lastMessageTime: '1h ago',
    unreadCount: 0,
  },
  {
    id: '3',
    friendId: '4',
    friendName: 'Emma Williams',
    friendAvatar: undefined,
    isOnline: false,
    lastMessage: 'Thanks for the feedback!',
    lastMessageTime: 'Yesterday',
    unreadCount: 1,
  },
  {
    id: '4',
    friendId: '5',
    friendName: 'Alex Rodriguez',
    friendAvatar: undefined,
    isOnline: true,
    lastMessage: 'Let us sync up tomorrow morning',
    lastMessageTime: '2d ago',
    unreadCount: 0,
  },
];

export const totalUnread = MOCK_CONVERSATIONS.reduce((sum, c) => sum + c.unreadCount, 0);