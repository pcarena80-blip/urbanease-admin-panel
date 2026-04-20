import { useState } from 'react';
import { Filter, Trash2, Ban, Flag, ImageIcon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';
import { toast } from 'sonner';
import { useLiveRefresh } from './AdminShared';
import { resolveMediaUrl } from '../utils/media';

interface Message {
  id: string;
  user: string;
  message: string;
  time: string;
  timestamp?: string;
  flagged: boolean;
  senderId?: string;
  attachment?: string;
  attachmentType?: string | null;
  attachmentName?: string;
}

export function ChatModeration() {
  const { theme } = useTheme();
  const [filter, setFilter] = useState<'all' | 'flagged'>('all');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = async () => {
    try {
      if (messages.length === 0) {
        setLoading(true);
      }

      const response = await api.get('/admin/chat/messages');
      const nextMessages = Array.isArray(response.data) ? response.data : [];

      setMessages(nextMessages);
      setError(null);
    } catch (requestError) {
      console.error('Error fetching admin chat messages:', requestError);
      setError('Chat moderation data could not be loaded right now.');
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useLiveRefresh(fetchMessages, 15000, [messages.length]);

  const handleDelete = async (id: string) => {
    try {
      setMessages((currentMessages) => currentMessages.filter((message) => message.id !== id));
      await api.delete(`/admin/chat/messages/${id}`);
      toast.success('Message deleted');
    } catch (requestError) {
      console.error('Error deleting message:', requestError);
      toast.error('Failed to delete message');
      fetchMessages();
    }
  };

  const filteredMessages = messages.filter((message) => {
    if (filter === 'flagged') {
      return message.flagged;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl ${theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>Chat Moderation</h2>
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Monitor and moderate community chat messages</p>
        </div>
        <div className="flex items-center gap-3">
          <Filter className={`h-5 w-5 ${theme === 'dark' ? 'text-white opacity-70' : 'text-gray-600'}`} />
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`rounded-lg px-4 py-2 transition-colors ${
                filter === 'all'
                  ? 'bg-[#57cf85] text-white'
                  : theme === 'dark'
                    ? 'bg-[#2A2A2A] text-gray-300 hover:bg-[#333333]'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Messages
            </button>
            <button
              onClick={() => setFilter('flagged')}
              className={`rounded-lg px-4 py-2 transition-colors ${
                filter === 'flagged'
                  ? 'bg-[#57cf85] text-white'
                  : theme === 'dark'
                    ? 'bg-[#2A2A2A] text-gray-300 hover:bg-[#333333]'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Flagged Messages
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        {loading ? (
          <div className={`py-10 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Loading messages...</div>
        ) : error ? (
          <div className={`py-10 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{error}</div>
        ) : filteredMessages.length === 0 ? (
          <div className={`py-10 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            {messages.length === 0 ? 'No community chat messages have been posted yet.' : 'No messages match the selected filter.'}
          </div>
        ) : (
          filteredMessages.map((message) => (
            <div
              key={message.id}
              className={`rounded-xl border p-5 shadow-sm ${
                message.flagged
                  ? theme === 'dark'
                    ? 'border-red-500/30 bg-red-500/10'
                    : 'border-red-200 bg-red-50/30'
                  : theme === 'dark'
                    ? 'border-[#333333] bg-[#1F1F1F]'
                    : 'border-gray-100 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex flex-1 gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#57cf85] text-white">
                    {message.user.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <p className={theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}>{message.user}</p>
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>{message.time}</span>
                      {message.flagged ? (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${
                            theme === 'dark' ? 'bg-red-500/30 text-red-300' : 'bg-red-100 text-red-600'
                          }`}
                        >
                          <Flag className="h-3 w-3" />
                          Flagged
                        </span>
                      ) : null}
                    </div>

                    {message.attachment && message.attachmentType === 'image' ? (
                      <div className="mb-2">
                        <a href={resolveMediaUrl(message.attachment)} target="_blank" rel="noopener noreferrer">
                          <img
                            src={resolveMediaUrl(message.attachment)}
                            alt={message.attachmentName || 'Chat attachment'}
                            className="max-h-[150px] max-w-[200px] rounded-lg border border-gray-200 object-cover transition-opacity hover:opacity-90"
                          />
                        </a>
                      </div>
                    ) : null}

                    {message.attachment && message.attachmentType !== 'image' ? (
                      <div className="mb-2">
                        <a
                          href={resolveMediaUrl(message.attachment)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ${
                            theme === 'dark'
                              ? 'bg-[#2A2A2A] text-[#57cf85] hover:bg-[#333333]'
                              : 'bg-[#57cf85]/12 text-[#57cf85] hover:bg-[#57cf85]/20'
                          }`}
                        >
                          <ImageIcon className="h-4 w-4" />
                          {message.attachmentName || 'Attachment'}
                        </a>
                      </div>
                    ) : null}

                    {message.message ? (
                      <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{message.message}</p>
                    ) : null}
                  </div>
                </div>

                <div className="ml-4 flex gap-2">
                  <button
                    onClick={() => handleDelete(message.id)}
                    className={`group rounded-lg p-2 transition-colors ${
                      theme === 'dark' ? 'hover:bg-red-500/20' : 'hover:bg-red-50'
                    }`}
                    title="Delete Message"
                  >
                    <Trash2
                      className={`h-5 w-5 ${
                        theme === 'dark'
                          ? 'text-white opacity-70 group-hover:text-red-400'
                          : 'text-gray-600 group-hover:text-red-600'
                      }`}
                    />
                  </button>
                  <button
                    className={`group rounded-lg p-2 transition-colors ${
                      theme === 'dark' ? 'hover:bg-orange-500/20' : 'hover:bg-orange-50'
                    }`}
                    title="Block User"
                  >
                    <Ban
                      className={`h-5 w-5 ${
                        theme === 'dark'
                          ? 'text-white opacity-70 group-hover:text-orange-400'
                          : 'text-gray-600 group-hover:text-orange-600'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
