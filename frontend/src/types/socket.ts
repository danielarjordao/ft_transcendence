export interface SocketEvents {
  // Conexão
  connect: () => void;
  disconnect: () => void;
  connect_error: (error: Error) => void;
  
  // Chat
  'chat:join': (roomId: string) => void;
  'chat:leave': (roomId: string) => void;
  'message:new': (message: any) => void;
  'typing:start': (roomId: string) => void;
  'typing:stop': (roomId: string) => void;
  'typing:user': (data: { userId: string; roomId: string; isTyping: boolean }) => void;
  
  // Rooms
  'room:join': (roomId: string) => void;
  'room:leave': (roomId: string) => void;
  
  // Tasks
  'task:created': (task: any) => void;
  'task:updated': (task: any) => void;
  'task:deleted': (taskId: string) => void;
  'task:moved': (data: { taskId: string; toStatus: string }) => void;
  
  // Members
  'member:added': (member: any) => void;
  'member:removed': (data: { userId: string }) => void;
  'member:role_updated': (data: { userId: string; newRole: string }) => void;
  
  // Notifications
  'notification:new': (notification: any) => void;
}