import type { Message } from '../../types/chat';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
}

export default function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  // Formatar timestamp (ex: "10:32 AM")
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className={`flex items-start gap-2 mb-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
      {/* Avatar (só mostra para mensagens de outros) */}
      {!isOwnMessage && (
        <div className="w-8 h-8 bg-gray-600 rounded-full flex-shrink-0 flex items-center justify-center">
          {message.senderAvatar ? (
            <img
              src={message.senderAvatar}
              alt={message.senderName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-white text-xs font-semibold">
              {message.senderName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      )}

      {/* Message bubble */}
      <div className={`flex flex-col max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        {/* Sender name (só para mensagens de outros) */}
        {!isOwnMessage && (
          <span className="text-[#4CAF50] text-xs font-medium mb-1">
            {message.senderName}
          </span>
        )}

        {/* Content */}
        <div
          className={`px-4 py-2.5 rounded-lg ${
            isOwnMessage
              ? 'bg-[#3A3A3A] text-white rounded-br-sm'
              : 'bg-[#2C2C2C] text-white rounded-bl-sm'
          }`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>

        {/* Timestamp */}
        <span className="text-gray-500 text-xs mt-1">
          {formatTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
}