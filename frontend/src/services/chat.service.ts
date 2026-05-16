import api from './api';
import type { Message, Conversation } from '../types/chat';

export const chatService = {
  // ✅ GET /api/conversations - Listar conversas
  async getConversations(): Promise<Conversation[]> {
    const response = await api.get('/conversations');
    return response.data;
  },

  // ✅ GET /api/messages/:friendId - Histórico de mensagens
  async getMessages(
    friendId: string, 
    limit = 50, 
    offset = 0
  ): Promise<Message[]> {
    const response = await api.get(`/messages/${friendId}`, {
      params: { limit, offset },
    });
    return response.data;
  },

  // ✅ POST /api/messages - Enviar mensagem
  async sendMessage(
    friendId: string, 
    content: string
  ): Promise<Message> {
    const response = await api.post('/messages', {
      friendId,
      content,
    });
    return response.data;
  },
};