import { useState, useCallback } from 'react';
import type { Message } from '../types/chat';

interface UseChatOptions {
  currentUserId: string;
  currentUserName?: string;
}

interface UseChatReturn {
  messages: Record<string, Message[]>;
  sendMessage: (roomId: string, content: string) => void;
  loadMessages: (roomId: string, msgs: Message[]) => void;
  clearRoom: (roomId: string) => void;
}

export function useChat({ currentUserId, currentUserName = 'You' }: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<Record<string, Message[]>>({});

  const sendMessage = useCallback((roomId: string, content: string) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: currentUserId,
      senderName: currentUserName,
      content,
      createdAt: new Date().toISOString(),
      roomId,
    };

    setMessages(prev => ({
      ...prev,
      [roomId]: [...(prev[roomId] ?? []), newMessage],
    }));

    // TODO: conectar ao socket quando backend estiver pronto
    // socketService.emit('message:send', { content, roomId });
  }, [currentUserId, currentUserName]);

  const loadMessages = useCallback((roomId: string, msgs: Message[]) => {
    setMessages(prev => ({ ...prev, [roomId]: msgs }));
  }, []);

  const clearRoom = useCallback((roomId: string) => {
    setMessages(prev => {
      const next = { ...prev };
      delete next[roomId];
      return next;
    });
  }, []);

  // TODO: registrar listeners do socket quando backend estiver pronto
  // socketService.on('message:new', (message) => {
  //   setMessages(prev => ({
  //     ...prev,
  //     [message.roomId]: [...(prev[message.roomId] ?? []), message],
  //   }));
  // });

  return { messages, sendMessage, loadMessages, clearRoom };
}