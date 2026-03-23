import { Search, X } from 'lucide-react';
import type { Conversation } from '../../types/chat';

interface ConversationListProps {
  conversations: Conversation[];
  onSelectConversation: (conversationId: string) => void;
  onClose: () => void;
}

export default function ConversationList({
  conversations,
  onSelectConversation,
  onClose,
}: ConversationListProps) {
  return (
    <div className="w-full h-full bg-[#1A1A1A] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#222222]">
        <h2 className="text-white font-semibold text-lg">Messages</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded transition-colors"
          aria-label="Close chat"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations"
            className="w-full bg-[#222222] text-white placeholder-gray-500 pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 px-4 text-center">
            <p className="text-sm">No conversations yet</p>
            <p className="text-xs mt-1">Start chatting with your teammates</p>
          </div>
        ) : (
          <div>
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors border-b border-[#222222]/50"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                    {conv.friendAvatar ? (
                      <img
                        src={conv.friendAvatar}
                        alt={conv.friendName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-semibold text-sm">
                        {conv.friendName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {/* Online indicator */}
                  <div
                    className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#1A1A1A] ${
                      conv.isOnline ? 'bg-[#4CAF50]' : 'bg-[#555555]'
                    }`}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-medium text-sm truncate">
                      {conv.friendName}
                    </span>
                    <span className="text-gray-400 text-xs flex-shrink-0 ml-2">
                      {conv.lastMessageTime}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm truncate">
                    {conv.lastMessage}
                  </p>
                </div>

                {/* Unread badge */}
                {conv.unreadCount > 0 && (
                  <div className="flex-shrink-0 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <span className="text-black text-xs font-semibold">
                      {conv.unreadCount}
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2 border-t border-[#222222]">
        <p className="text-gray-500 text-xs text-center">
          Chat Sidebar — Conversation List
        </p>
      </div>
    </div>
  );
}