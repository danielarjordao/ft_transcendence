export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  createdAt: string;
  roomId: string;
  isOwnMessage?: boolean;
}

export interface Conversation {
  id: string; // ID da conversa (friendId)
  friendId: string;
  friendName: string;
  friendAvatar?: string;
  isOnline: boolean;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface User {
  id: string;
  name: string;
  avatar?: string;
  online?: boolean;
}

export interface TypingUser {
  userId: string;
  userName: string;
}

export interface SocketEvents {
  // Client -> Server
  'message:send': (data: { content: string; roomId: string }) => void;
  'room:join': (roomId: string) => void;
  'room:leave': (roomId: string) => void;
  'typing:start': (roomId: string) => void;
  'typing:stop': (roomId: string) => void;

  // Server -> Client
  'message:new': (message: Message) => void;
  'message:history': (messages: Message[]) => void;
  'user:online': (userId: string) => void;
  'user:offline': (userId: string) => void;
  'typing:user': (data: { userId: string; roomId: string; isTyping: boolean }) => void;
}