import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import ConversationList from './ConversationList';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { useChat } from '../../hooks/useChat';
import { MOCK_CONVERSATIONS } from '../../constants/chat';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
}

// Mock seed para popular conversas iniciais
const MOCK_SEED: Record<string, { senderId: string; senderName: string; content: string; offset: number }[]> = {
  '1': [
    { senderId: '2',  senderName: 'Sarah Chen',    content: 'Hey! Did you see the new designs for the dashboard?',            offset: 240000 },
    { senderId: 'me', senderName: 'You',            content: 'I think we need to adjust the spacing on the cards',             offset: 180000 },
    { senderId: '2',  senderName: 'Sarah Chen',    content: 'Yeah I saw them, they look great overall',                       offset: 150000 },
    { senderId: 'me', senderName: 'You',            content: 'Good catch on the spacing, let me update that',                  offset: 90000  },
    { senderId: '2',  senderName: 'Sarah Chen',    content: 'Sounds good! I will update the board once you push the changes', offset: 60000  },
  ],
  '2': [
    { senderId: '3',  senderName: 'Marcus Johnson', content: 'Can you review the designs when you get a chance?', offset: 3600000 },
  ],
  '3': [
    { senderId: 'me', senderName: 'You',            content: 'Great work on the presentation!', offset: 86400000 },
    { senderId: '4',  senderName: 'Emma Williams',  content: 'Thanks for the feedback!',        offset: 86000000 },
  ],
  '4': [],
};

export default function ChatPanel({ isOpen, onClose, currentUserId }: ChatPanelProps) {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  
  // ===== HOOK COM SOCKET.IO =====
  const {
    messages,
    typingUsers,
    sendMessage,
    loadMessages,
    startTyping,
    stopTyping,
    joinRoom,
    leaveRoom,
  } = useChat({ currentUserId, currentUserName: 'You' });

  // ===== CARREGAR MOCK SEED (apenas uma vez) =====
  useEffect(() => {
    Object.entries(MOCK_SEED).forEach(([roomId, seed]) => {
      const msgs = seed.map((m, i) => ({
        id: `seed-${roomId}-${i}`,
        senderId: m.senderId === 'me' ? currentUserId : m.senderId,
        senderName: m.senderName,
        content: m.content,
        createdAt: new Date(Date.now() - m.offset).toISOString(),
        roomId,
      }));
      loadMessages(roomId, msgs);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== JOIN/LEAVE ROOM quando selecionar conversa =====
  useEffect(() => {
    if (!selectedConversationId) return;

    console.log('🔌 Selected conversation:', selectedConversationId);
    joinRoom(selectedConversationId);

    return () => {
      leaveRoom(selectedConversationId);
    };
  }, [selectedConversationId, joinRoom, leaveRoom]);

  // ===== HANDLERS =====
  const selectedConversation = MOCK_CONVERSATIONS.find(c => c.id === selectedConversationId);
  const currentMessages = selectedConversationId ? (messages[selectedConversationId] ?? []) : [];
  
  // Verificar se alguém está digitando nesta room
  const isTyping = selectedConversationId
    ? (typingUsers[selectedConversationId]?.size ?? 0) > 0
    : false;

  const handleSendMessage = (content: string) => {
    if (!selectedConversationId) return;
    
    // Agora usa Socket.io internamente!
    sendMessage(selectedConversationId, content);
  };

  const handleStartTyping = () => {
    if (!selectedConversationId) return;
    startTyping(selectedConversationId);
  };

  const handleStopTyping = () => {
    if (!selectedConversationId) return;
    stopTyping(selectedConversationId);
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', right: 0, top: 0, height: '100%', width: 384, background: '#1A1A1A', boxShadow: '0 0 40px rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {selectedConversationId && selectedConversation ? (
        <>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid #222222' }}>
            <button
              onClick={() => setSelectedConversationId(null)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <ArrowLeft size={18} color="#CCCCCC" />
            </button>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#2A2A2A', border: '1px solid #3A3A3A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: '#CCC', fontSize: 12, fontWeight: 700 }}>{selectedConversation.friendName.charAt(0).toUpperCase()}</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#EEEEEE', fontSize: 13, fontWeight: 600, margin: 0 }}>{selectedConversation.friendName}</p>
              <p style={{ color: selectedConversation.isOnline ? '#50C878' : '#555', fontSize: 11, margin: 0 }}>{selectedConversation.isOnline ? 'Online' : 'Offline'}</p>
            </div>
          </div>

          {/* Messages - AGORA COM SOCKET.IO */}
          <MessageList
            messages={currentMessages}
            currentUserId={currentUserId}
            isTyping={isTyping}
          />

          {/* Input - COM TYPING INDICATORS */}
          <MessageInput
            onSend={handleSendMessage}
            onTypingStart={handleStartTyping}
            onTypingStop={handleStopTyping}
          />

          {/* Footer */}
          <div style={{ padding: '8px 16px', borderTop: '1px solid #222222' }}>
            <p style={{ color: '#4CAF50', fontSize: 11, textAlign: 'center', margin: 0 }}>
              ✅ Socket.io ready! Aguardando backend...
            </p>
          </div>
        </>
      ) : (
        <ConversationList
          conversations={MOCK_CONVERSATIONS}
          onSelectConversation={setSelectedConversationId}
          onClose={onClose}
        />
      )}
    </div>
  );
}