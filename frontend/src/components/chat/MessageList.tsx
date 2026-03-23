import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import type { Message } from '../../types/chat';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  isTyping?: boolean;
}

export default function MessageList({
  messages,
  currentUserId,
  isTyping = false,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para o fim quando novas mensagens chegarem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500 text-sm">No messages yet. Start the conversation!</p>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwnMessage={message.senderId === currentUserId}
            />
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-gray-600 rounded-full flex-shrink-0" />
              <div className="bg-[#2C2C2C] px-4 py-2.5 rounded-lg rounded-bl-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
}