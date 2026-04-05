import { useState, useEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
 
interface MessageInputProps {
  onSend: (content: string) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  disabled?: boolean;
}
 
export default function MessageInput({
  onSend,
  onTypingStart,
  onTypingStop,
  disabled = false,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);
 
  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed || disabled) return;
 
    onSend(trimmed);
    setMessage('');
 
    // Stop typing ao enviar
    if (isTypingRef.current && onTypingStop) {
      onTypingStop();
      isTypingRef.current = false;
    }
  };
 
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter = enviar (Shift+Enter = nova linha)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
 
  // ===== TYPING INDICATOR LOGIC =====
  useEffect(() => {
    // Se não tem handlers ou mensagem vazia, ignora
    if (!onTypingStart || !onTypingStop || !message) {
      // Se tinha typing ativo e agora está vazio, stop
      if (isTypingRef.current && !message && onTypingStop) {
        onTypingStop();
        isTypingRef.current = false;
      }
      return;
    }
 
    // Se não estava digitando, começa
    if (!isTypingRef.current) {
      console.log('⌨️ Start typing');
      onTypingStart();
      isTypingRef.current = true;
    }
 
    // Clear timeout anterior
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
 
    // Stop typing após 1 segundo de inatividade
    typingTimeoutRef.current = setTimeout(() => {
      console.log('⌨️ Stop typing (timeout)');
      onTypingStop();
      isTypingRef.current = false;
    }, 1000);
 
    // Cleanup
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, onTypingStart, onTypingStop]);
 
  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTypingRef.current && onTypingStop) {
        onTypingStop();
      }
    };
  }, [onTypingStop]);
 
  return (
    <div className="px-4 py-3 border-t border-[#222222]">
      <div className="flex items-end gap-2">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={disabled}
          rows={1}
          className="flex-1 bg-[#222222] text-white placeholder-gray-500 px-4 py-2.5 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-600 max-h-32 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className="p-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          aria-label="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
 