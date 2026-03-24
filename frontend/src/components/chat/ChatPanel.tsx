import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import ConversationList from './ConversationList';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import type { Conversation, Message } from '../../types/chat';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
}

export default function ChatPanel({ isOpen, onClose, currentUserId }: ChatPanelProps) {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  // ===== MOCK DATA (Bloco 2 - dados estáticos) =====
  const mockConversations: Conversation[] = [
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

  const mockMessages: Record<string, Message[]> = {
    '1': [
      {
        id: 'm1',
        senderId: '2',
        senderName: 'Sarah Chen',
        content: 'Hey! Did you see the new designs for the dashboard?',
        createdAt: new Date(Date.now() - 240000).toISOString(), // 4 min ago
        roomId: '1',
      },
      {
        id: 'm2',
        senderId: currentUserId,
        senderName: 'You',
        content: 'I think we need to adjust the spacing on the cards',
        createdAt: new Date(Date.now() - 180000).toISOString(), // 3 min ago
        roomId: '1',
      },
      {
        id: 'm3',
        senderId: '2',
        senderName: 'Sarah Chen',
        content: 'Yeah I saw them, they look great overall',
        createdAt: new Date(Date.now() - 150000).toISOString(),
        roomId: '1',
      },
      {
        id: 'm4',
        senderId: currentUserId,
        senderName: 'You',
        content: 'Good catch on the spacing, let me update that',
        createdAt: new Date(Date.now() - 90000).toISOString(),
        roomId: '1',
      },
      {
        id: 'm5',
        senderId: '2',
        senderName: 'Sarah Chen',
        content: 'Sounds good! I will update the board once you push the changes',
        createdAt: new Date(Date.now() - 60000).toISOString(), // 1 min ago
        roomId: '1',
      },
    ],
    '2': [
      {
        id: 'm6',
        senderId: '3',
        senderName: 'Marcus Johnson',
        content: 'Can you review the designs when you get a chance?',
        createdAt: new Date(Date.now() - 3600000).toISOString(), // 1h ago
        roomId: '2',
      },
    ],
    '3': [
      {
        id: 'm7',
        senderId: currentUserId,
        senderName: 'You',
        content: 'Great work on the presentation!',
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        roomId: '3',
      },
      {
        id: 'm8',
        senderId: '4',
        senderName: 'Emma Williams',
        content: 'Thanks for the feedback!',
        createdAt: new Date(Date.now() - 86000000).toISOString(),
        roomId: '3',
      },
    ],
    '4': [],
  };

  // Estado de typing (mock - no Bloco 3 virá do Socket)
  const [isTyping] = useState(false);

  // ===== HANDLERS =====
  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
  };

  const handleBackToList = () => {
    setSelectedConversationId(null);
  };

  const handleSendMessage = (content: string) => {
    console.log('📤 Sending message:', content);
    // Bloco 3: Aqui será socket.emit('message:send', { content, roomId })

    // Mock: Adicionar mensagem instantaneamente (optimistic update)
    const newMessage: Message = {
      id: 'temp-' + Date.now(),
      senderId: currentUserId,
      senderName: 'You',
      content,
      createdAt: new Date().toISOString(),
      roomId: selectedConversationId!,
    };

    // Em produção, isso seria feito via Socket (Bloco 3)
    console.log('✅ Message sent (mock):', newMessage);
  };

  // Pegar conversa selecionada
  const selectedConversation = mockConversations.find(
    (c) => c.id === selectedConversationId
  );

  // Pegar mensagens da conversa selecionada
  const currentMessages = selectedConversationId
    ? mockMessages[selectedConversationId] || []
    : [];

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-[#1A1A1A] shadow-2xl z-50 flex flex-col">
      {selectedConversationId && selectedConversation ? (
        // Frame 2: Conversa aberta
        <>
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#222222]">
            <button
              onClick={handleBackToList}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              aria-label="Back to list"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>

            {/* Friend info */}
            <div className="flex items-center gap-2 flex-1">
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-semibold">
                  {selectedConversation.friendName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-white font-medium text-sm">
                  {selectedConversation.friendName}
                </span>
                <span className="text-[#4CAF50] text-xs">
                  {selectedConversation.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>

            {/* Return to list link */}
            <button
              onClick={handleBackToList}
              className="text-[#4CAF50] text-xs hover:underline"
            >
              Back to list
            </button>
          </div>

          {/* Messages */}
          <MessageList
            messages={currentMessages}
            currentUserId={currentUserId}
            isTyping={isTyping}
          />

          {/* Input */}
          <MessageInput onSend={handleSendMessage} />

          {/* Footer hint */}
          <div className="px-4 py-2 border-t border-[#222222]">
            <p className="text-gray-500 text-xs text-center">
              Chat Sidebar — Active Conversation
            </p>
          </div>
        </>
      ) : (
        // Frame 1: Lista de conversas
        <ConversationList
          conversations={mockConversations}
          onSelectConversation={handleSelectConversation}
          onClose={onClose}
        />
      )}
    </div>
  );
}