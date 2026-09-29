import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { ChatMessage } from '../types.ts';
import { IconClose, IconSend, IconMessage } from './icons.tsx';

export const ChatModal: React.FC = () => {
  const { user, activeChat, closeChat, socket } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeChat) return;

    setLoading(true);
    api
      .getChatMessages(activeChat.roomId)
      .then((res) => {
        if (res.success) {
          // De-dupe on load in case the DB somehow has duplicates
          const seen = new Set<string>();
          const unique = (res.messages as ChatMessage[]).filter((m) => {
            if (seen.has(m.id)) return false;
            seen.add(m.id);
            return true;
          });
          setMessages(unique);
        }
      })
      .catch((err) => console.warn('Chat messages fetch notice:', err))
      .finally(() => setLoading(false));

    if (!socket) return;

    // Join the room (single event name — backend listens to both)
    socket.emit('joinRoom', { roomId: activeChat.roomId });

    const handleNewMessage = (msg: ChatMessage) => {
      if (msg.roomId !== activeChat.roomId) return;
      setMessages((prev) => {
        // ✅ dedupe: skip if we already have this exact message id
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    // ✅ Listen to ONE canonical event only
    socket.on('new_message', handleNewMessage);

    return () => {
      socket.emit('leaveRoom', { roomId: activeChat.roomId });
      socket.off('new_message', handleNewMessage);
    };
  }, [activeChat?.roomId, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!activeChat) return null;

  const sendMessageContent = async (textToSend: string) => {
    if (!textToSend.trim() || !user) return;
    const text = textToSend.trim();

    setInputText('');

    // ✅ Socket-only send. The server persists + broadcasts to the room.
    //    We do NOT add an optimistic message and we do NOT call REST.
    //    This eliminates duplicates entirely.
    if (socket && socket.connected) {
      socket.emit('sendMessage', {
        roomId: activeChat.roomId,
        campusId: user.campusId || 'campus_stanford',
        senderId: user.id,
        senderName: user.name,
        senderAvatar: user.avatar,
        text,
      });
      return;
    }

    // Fallback: if socket isn't connected, use REST
    try {
      await api.sendChatMessage(activeChat.roomId, text);
      // The server broadcasts via socket once it's connected; if not,
      // the message still persists but won't arrive until refresh.
    } catch (err) {
      console.warn('Failed to send message:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessageContent(inputText);
  };

  return (
    <div
      role="dialog"
      aria-label={`Chat with ${activeChat.title}`}
      className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 bg-[#ffffff] rounded-xl shadow-xl border border-[#e5e5ea] overflow-hidden flex flex-col h-[460px] text-[#1d1d1f]"
    >
      {/* Header */}
      <div className="bg-[#f5f5f7] border-b border-[#e5e5ea] p-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-2 truncate">
          <IconMessage className="w-4 h-4 text-[#0071e3]" />
          <div className="truncate">
            <div className="font-semibold text-xs text-[#1d1d1f] truncate leading-tight">
              {activeChat.title}
            </div>
            <div className="text-[10px] text-[#86868b] truncate mt-0.5">
              {activeChat.subtitle || 'Campus-Locked Direct Channel'}
            </div>
          </div>
        </div>
        <button
          onClick={closeChat}
          aria-label="Close chat"
          className="p-1 rounded text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#e5e5ea] transition-colors cursor-pointer"
        >
          <IconClose className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2.5 bg-[#fbfbfa] text-xs">
        {loading ? (
          <div className="text-center text-[#86868b] text-xs py-8">
            Loading chat history...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-[#86868b] text-xs py-8">
            No previous messages. Coordinate your session details below.
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.senderId === user?.id;
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                {!isMe && (
                  <span className="text-[10px] font-medium text-[#86868b] mb-0.5 ml-1">
                    {m.senderName}
                  </span>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-xs leading-relaxed ${isMe
                    ? 'bg-[#0071e3] text-white'
                    : 'bg-[#ffffff] text-[#1d1d1f] border border-[#e5e5ea]'
                    }`}
                >
                  {m.text}
                </div>
                <span className="text-[9px] text-[#86868b] mt-0.5 px-1">
                  {new Date(m.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick pills */}
      <div className="px-2.5 py-1.5 bg-[#f5f5f7] border-t border-[#e5e5ea] flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {[
          '📍 What is the pickup location?',
          '⏰ What time works best?',
          '🏡 Still available?',
          '🤝 Interested in matching!',
        ].map((pill, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => sendMessageContent(pill)}
            className="text-[10px] bg-white hover:bg-[#e5e5ea] text-[#1d1d1f] font-medium px-2 py-0.5 rounded-full border border-[#d2d2d7] whitespace-nowrap transition cursor-pointer shrink-0"
          >
            {pill}
          </button>
        ))}
      </div>

      {/* Composer */}
      <form
        onSubmit={handleSendMessage}
        className="p-2.5 bg-[#ffffff] border-t border-[#e5e5ea] flex items-center space-x-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type message..."
          aria-label="Message input"
          className="flex-1 px-3 py-1.5 text-xs rounded-md border border-[#d2d2d7] bg-[#ffffff] text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
        />
        <button
          type="submit"
          aria-label="Send message"
          className="bg-[#1d1d1f] hover:bg-[#333336] text-white p-2 rounded-md transition-colors cursor-pointer shrink-0"
        >
          <IconSend className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};