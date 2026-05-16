import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import type { Message } from '../types/chat';
import { chatService } from '../services/chat.service';

interface UseChatOptions {
  currentUserId: string;
  currentUserName?: string;
}

interface UseChatReturn {
  messages: Record<string, Message[]>;
  isLoading: boolean;
  error: string | null;
  typingUsers: Record<string, Set<string>>;
  sendMessage: (roomId: string, content: string) => void;
  loadMessages: (roomId: string, msgs: Message[]) => void;
  clearRoom: (roomId: string) => void;
  startTyping: (roomId: string) => void;
  stopTyping: (roomId: string) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
}

export function useChat({ currentUserId, currentUserName = 'You' }: UseChatOptions): UseChatReturn {
  const { socket, isConnected } = useSocket();
  
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, Set<string>>>({});
  
  const messageIdsRef = useRef<Set<string>>(new Set());
  const currentRoomsRef = useRef<Set<string>>(new Set());

  // ===== JOIN ROOM =====
  const joinRoom = useCallback(async (roomId: string) => {
    if (!socket || !isConnected) {
      console.warn('⚠️ Cannot join room: socket not connected');
      return;
    }

    if (currentRoomsRef.current.has(roomId)) {
      console.log('ℹ️ Already in room:', roomId);
      return;
    }

    console.log('🔌 Joining room:', roomId);
    socket.emit('chat:join', roomId);
    currentRoomsRef.current.add(roomId);
    
    // ✅ CARREGAR MENSAGENS DO BACKEND
    try {
      console.log('📥 Loading messages for:', roomId);
      const loadedMessages = await chatService.getMessages(roomId);
      
      // Adicionar IDs ao Set
      loadedMessages.forEach(m => messageIdsRef.current.add(m.id));
      
      setMessages(prev => ({
        ...prev,
        [roomId]: loadedMessages,
      }));
      
      console.log(`✅ Loaded ${loadedMessages.length} messages`);
    } catch (error) {
      console.error('❌ Failed to load messages:', error);
      setMessages(prev => ({
        ...prev,
        [roomId]: [],
      }));
    }
  }, [socket, isConnected]);

  // ===== LEAVE ROOM =====
  const leaveRoom = useCallback((roomId: string) => {
    if (!currentRoomsRef.current.has(roomId)) return;

    console.log('🔌 Leaving room:', roomId);
    socket.emit('chat:leave', roomId);
    currentRoomsRef.current.delete(roomId);

    setTypingUsers(prev => {
      const next = { ...prev };
      delete next[roomId];
      return next;
    });
  }, [socket]);

  // ===== SEND MESSAGE =====
  const sendMessage = useCallback(async (roomId: string, content: string) => {
    if (!roomId || !socket || !isConnected) {
      console.error('❌ Cannot send: invalid params or not connected');
      return;
    }
    
    const trimmed = content.trim();
    if (!trimmed) return;
    
    try {
      console.log('📤 Sending message to:', roomId);
      
      // ✅ ENVIAR VIA API
      const message = await chatService.sendMessage(roomId, trimmed);
      
      console.log('✅ Message sent:', message.id);
      
      // Adicionar ID ao Set
      messageIdsRef.current.add(message.id);
      
      // ✅ Optimistic update
      setMessages(prev => ({
        ...prev,
        [roomId]: [...(prev[roomId] || []), message],
      }));
      
      // Parar typing ao enviar
      stopTyping(roomId);
      
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      setError('Failed to send message');
    }
  }, [socket, isConnected]);

  // ===== LOAD MESSAGES (para mock seed) =====
  const loadMessages = useCallback((roomId: string, msgs: Message[]) => {
    console.log(`📥 Loading ${msgs.length} messages for room ${roomId}`);
    msgs.forEach(m => messageIdsRef.current.add(m.id));
    setMessages(prev => ({ ...prev, [roomId]: msgs }));
  }, []);

  // ===== CLEAR ROOM =====
  const clearRoom = useCallback((roomId: string) => {
    console.log('🗑️ Clearing room:', roomId);
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
    };

    socket.on('message:new', handleNewMessage);

    return () => {
      socket.off('message:new', handleNewMessage);
    };
  }, [isConnected, socket]);

  // ===== LISTENER: typing:user =====
  useEffect(() => {
    if (!isConnected) return;

    const handleTyping = (data: { userId: string; roomId: string; isTyping: boolean }) => {
      console.log('⌨️ Typing event:', data);

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
        socket.emit('chat:leave', roomId);
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