import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import type { Message } from '../types/chat';
 
interface UseChatOptions {
  currentUserId: string;
  currentUserName?: string;
}
 
interface UseChatReturn {
  // Estado de mensagens
  messages: Record<string, Message[]>;
  
  // Loading e erros
  isLoading: boolean;
  error: string | null;
  
  // Typing indicators
  typingUsers: Record<string, Set<string>>; // roomId -> Set de userIds digitando
  
  // Ações
  sendMessage: (roomId: string, content: string) => void;
  loadMessages: (roomId: string, msgs: Message[]) => void;
  clearRoom: (roomId: string) => void;
  startTyping: (roomId: string) => void;
  stopTyping: (roomId: string) => void;
  
  // Join/Leave
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
}
 
export function useChat({ currentUserId, currentUserName = 'You' }: UseChatOptions): UseChatReturn {
  const { socket, isConnected } = useSocket();
  
  // Estados
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, Set<string>>>({});
  
  // Refs para evitar duplicatas
  const messageIdsRef = useRef<Set<string>>(new Set());
  const currentRoomsRef = useRef<Set<string>>(new Set());
 
  // ===== JOIN ROOM =====
  const joinRoom = useCallback((roomId: string) => {
    if (!isConnected) {
      console.warn('⚠️ Cannot join room: socket not connected');
      return;
    }
 
    if (currentRoomsRef.current.has(roomId)) {
      console.log('ℹ️ Already in room:', roomId);
      return;
    }
 
    console.log('🔌 Joining room:', roomId);
    socket.joinRoom(roomId);
    currentRoomsRef.current.add(roomId);
 
    // Request histórico (se backend suportar)
    // socket.emit('message:history', roomId);
  }, [isConnected, socket]);
 
  // ===== LEAVE ROOM =====
  const leaveRoom = useCallback((roomId: string) => {
    if (!currentRoomsRef.current.has(roomId)) return;
 
    console.log('🔌 Leaving room:', roomId);
    socket.leaveRoom(roomId);
    currentRoomsRef.current.delete(roomId);
 
    // Limpar typing indicators desta room
    setTypingUsers(prev => {
      const next = { ...prev };
      delete next[roomId];
      return next;
    });
  }, [socket]);
 
  // ===== SEND MESSAGE =====
  const sendMessage = useCallback((roomId: string, content: string) => {
    if (!isConnected) {
      setError('Cannot send message: not connected');
      console.error('❌ Cannot send: socket not connected');
      return;
    }
 
    // Optimistic update
    const tempMessage: Message = {
      id: `temp-${Date.now()}-${Math.random()}`,
      senderId: currentUserId,
      senderName: currentUserName,
      content,
      createdAt: new Date().toISOString(),
      roomId,
    };
 
    console.log('📤 Sending message (optimistic):', tempMessage);
 
    // Adicionar localmente
    messageIdsRef.current.add(tempMessage.id);
    setMessages(prev => ({
      ...prev,
      [roomId]: [...(prev[roomId] ?? []), tempMessage],
    }));
 
    // Emitir para servidor
    socket.emit('message:send', { content, roomId });
 
    // Parar typing ao enviar
    stopTyping(roomId);
  }, [currentUserId, currentUserName, isConnected, socket]);
 
  // ===== LOAD MESSAGES (para mock seed) =====
  const loadMessages = useCallback((roomId: string, msgs: Message[]) => {
    console.log(`📥 Loading ${msgs.length} messages for room ${roomId}`);
    
    // Adicionar IDs ao Set
    msgs.forEach(m => messageIdsRef.current.add(m.id));
    
    setMessages(prev => ({ ...prev, [roomId]: msgs }));
  }, []);
 
  // ===== CLEAR ROOM =====
  const clearRoom = useCallback((roomId: string) => {
    console.log('🗑️ Clearing room:', roomId);
    
    // Remover IDs do Set
    const roomMsgs = messages[roomId] ?? [];
    roomMsgs.forEach(m => messageIdsRef.current.delete(m.id));
    
    setMessages(prev => {
      const next = { ...prev };
      delete next[roomId];
      return next;
    });
  }, [messages]);
 
  // ===== TYPING INDICATORS =====
  const startTyping = useCallback((roomId: string) => {
    if (!isConnected) return;
    
    console.log('⌨️ Start typing in room:', roomId);
    socket.emit('typing:start', roomId);
  }, [isConnected, socket]);
 
  const stopTyping = useCallback((roomId: string) => {
    if (!isConnected) return;
    
    console.log('⌨️ Stop typing in room:', roomId);
    socket.emit('typing:stop', roomId);
  }, [isConnected, socket]);
 
  // ===== LISTENER: message:new =====
  useEffect(() => {
    if (!isConnected) return;
 
    const handleNewMessage = (message: Message) => {
      console.log('📨 New message received:', message);
 
      // Evitar duplicatas
      if (messageIdsRef.current.has(message.id)) {
        console.log('⚠️ Duplicate message ignored:', message.id);
        return;
      }
 
      messageIdsRef.current.add(message.id);
 
      setMessages(prev => ({
        ...prev,
        [message.roomId]: [...(prev[message.roomId] ?? []), message],
      }));
 
      setIsLoading(false);
    };
 
    socket.on('message:new', handleNewMessage);
 
    return () => {
      socket.off('message:new', handleNewMessage);
    };
  }, [isConnected, socket]);
 
  // ===== LISTENER: message:history =====
  useEffect(() => {
    if (!isConnected) return;
 
    const handleHistory = (data: { roomId: string; messages: Message[] } | Message[]) => {
      // Backend pode enviar { roomId, messages } OU só messages[]
      const historyMessages = Array.isArray(data) ? data : data.messages;
      const roomId = Array.isArray(data) ? historyMessages[0]?.roomId : data.roomId;
 
      if (!roomId) {
        console.warn('⚠️ message:history sem roomId');
        return;
      }
 
      console.log(`📜 Message history received for ${roomId}:`, historyMessages.length);
 
      // Adicionar IDs ao Set
      historyMessages.forEach(m => messageIdsRef.current.add(m.id));
 
      setMessages(prev => ({
        ...prev,
        [roomId]: historyMessages,
      }));
 
      setIsLoading(false);
    };
 
    socket.on('message:history', handleHistory);
 
    return () => {
      socket.off('message:history', handleHistory);
    };
  }, [isConnected, socket]);
 
  // ===== LISTENER: typing:user =====
  useEffect(() => {
    if (!isConnected) return;
 
    const handleTyping = (data: { userId: string; roomId: string; isTyping: boolean }) => {
      console.log('⌨️ Typing event:', data);
 
      // Não mostrar próprio typing
      if (data.userId === currentUserId) return;
 
      setTypingUsers(prev => {
        const roomSet = new Set(prev[data.roomId] ?? []);
 
        if (data.isTyping) {
          roomSet.add(data.userId);
        } else {
          roomSet.delete(data.userId);
        }
 
        return {
          ...prev,
          [data.roomId]: roomSet,
        };
      });
 
      // Auto-limpar após 3 segundos
      if (data.isTyping) {
        setTimeout(() => {
          setTypingUsers(prev => {
            const roomSet = new Set(prev[data.roomId] ?? []);
            roomSet.delete(data.userId);
            return {
              ...prev,
              [data.roomId]: roomSet,
            };
          });
        }, 3000);
      }
    };
 
    socket.on('typing:user', handleTyping);
 
    return () => {
      socket.off('typing:user', handleTyping);
    };
  }, [isConnected, currentUserId, socket]);
 
  // ===== CLEANUP: Leave all rooms on unmount =====
  useEffect(() => {
    return () => {
      currentRoomsRef.current.forEach(roomId => {
        socket.leaveRoom(roomId);
      });
      currentRoomsRef.current.clear();
    };
  }, [socket]);
 
  return {
    messages,
    isLoading,
    error,
    typingUsers,
    sendMessage,
    loadMessages,
    clearRoom,
    startTyping,
    stopTyping,
    joinRoom,
    leaveRoom,
  };
}