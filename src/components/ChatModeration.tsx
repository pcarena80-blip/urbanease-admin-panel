import { useState, useEffect } from 'react';
import { Filter, Trash2, Ban, Flag, ImageIcon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';
import { toast } from 'sonner';

// Derive the server root URL from the API base URL (strip /api)
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SERVER_ROOT = API_BASE.replace(/\/api\/?$/, '');


interface Message {
  id: string;
  user: string;
  message: string;
  time: string;
  flagged: boolean;
  senderId?: string;
  attachment?: string;
  attachmentType?: string;
}

export function ChatModeration() {
  const { theme } = useTheme();
  const [filter, setFilter] = useState('all');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const clean = path.replace(/\\/g, '/').replace(/^\//, '');
    return `${SERVER_ROOT}/${clean}`;
  };

  const fetchMessages = async () => {
    try {
      const [communityResponse, reportsResponse] = await Promise.all([
        api.get('/chat/community'),
        api.get('/chat/reports')
      ]);

      // Map backend response to component format
      const communityMessages = communityResponse.data.map((msg: any) => ({
        id: msg.id,
        user: msg.name || 'Unknown User',
        message: msg.message || '',
        time: msg.time,
        flagged: false,
        senderId: msg.senderId,
        attachment: msg.attachment || null,
        attachmentType: msg.attachmentType || null,
        rawTime: msg.timestamp // Keep raw timestamp for sorting
      }));

      const reportedMessages = reportsResponse.data.map((msg: any) => ({
        id: msg.id,
        user: msg.name || 'Unknown User',
        message: msg.message || '',
        time: msg.time,
        flagged: true, // Explicitly flagged
        senderId: msg.senderId,
        attachment: msg.attachment || null,
        attachmentType: msg.attachmentType || null,
        rawTime: msg.timestamp
      }));

      // Merge and De-duplicate (Reports take precedence for 'flagged' status)
      const messageMap = new Map();

      communityMessages.forEach((msg: any) => messageMap.set(msg.id, msg));
      reportedMessages.forEach((msg: any) => messageMap.set(msg.id, msg));

      const mergedMessages = Array.from(messageMap.values()).sort((a: any, b: any) => {
        return new Date(b.rawTime).getTime() - new Date(a.rawTime).getTime();
      });

      setMessages(mergedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      // Optimistic update
      setMessages(prev => prev.filter(msg => msg.id !== id));
      await api.delete(`/chat/${id}`);
      toast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
      // Revert on error
      fetchMessages();
    }
  };

  const filteredMessages = messages.filter((msg) => {
    if (filter === 'all') return true;
    if (filter === 'flagged') return msg.flagged;
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
          <Filter className={`w-5 h-5 ${theme === 'dark' ? 'text-white opacity-70' : 'text-gray-600'}`} />
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${filter === 'all'
                ? 'bg-gradient-to-r from-[#00c878] to-[#00e68a] text-white'
                : theme === 'dark'
                  ? 'bg-[#2A2A2A] text-gray-300 hover:bg-[#333333]'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              All Messages
            </button>
            <button
              onClick={() => setFilter('flagged')}
              className={`px-4 py-2 rounded-lg transition-colors ${filter === 'flagged'
                ? 'bg-gradient-to-r from-[#00c878] to-[#00e68a] text-white'
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
          <div className={`text-center py-10 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Loading messages...
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className={`text-center py-10 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            No messages found.
          </div>
        ) : (
          filteredMessages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-xl p-5 shadow-sm border ${msg.flagged
                ? theme === 'dark'
                  ? 'bg-red-500/10 border-red-500/30'
                  : 'bg-red-50/30 border-red-200'
                : theme === 'dark'
                  ? 'bg-[#1F1F1F] border-[#333333]'
                  : 'bg-white border-gray-100'
                }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#00c878] to-[#00e68a] flex items-center justify-center text-white flex-shrink-0">
                    {msg.user.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}>{msg.user}</p>
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>{msg.time}</span>
                      {msg.flagged && (
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${theme === 'dark' ? 'bg-red-500/30 text-red-300' : 'bg-red-100 text-red-600'
                          }`}>
                          <Flag className="w-3 h-3" />
                          Flagged
                        </span>
                      )}
                    </div>
                    {/* Image attachment preview */}
                    {msg.attachment && msg.attachmentType === 'image' && (
                      <div className="mb-2">
                        <a href={getImageUrl(msg.attachment)} target="_blank" rel="noopener noreferrer">
                          <img
                            src={getImageUrl(msg.attachment)}
                            alt="Chat attachment"
                            className="max-w-[200px] max-h-[150px] rounded-lg object-cover border border-gray-200 hover:opacity-90 transition-opacity"
                            onError={(e) => {
                              // Replace broken image with a placeholder link
                              const el = e.target as HTMLImageElement;
                              const parent = el.parentElement;
                              if (parent) {
                                const filename = msg.attachment!.split('/').pop() || 'image';
                                parent.innerHTML = `<span style="display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border-radius:8px;background:#f3f4f6;color:#3b82f6;font-size:13px;">🖼️ ${filename}</span>`;
                              }
                            }}
                          />
                        </a>
                      </div>
                    )}
                    {/* Non-image file attachment */}
                    {msg.attachment && msg.attachmentType !== 'image' && (
                      <div className="mb-2">
                        <a
                          href={getImageUrl(msg.attachment)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${theme === 'dark' ? 'bg-[#2A2A2A] text-blue-400 hover:bg-[#333333]' : 'bg-gray-100 text-blue-600 hover:bg-gray-200'}`}
                        >
                          <ImageIcon className="w-4 h-4" />
                          📎 File Attachment
                        </a>
                      </div>
                    )}
                    {msg.message && (
                      <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{msg.message}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleDelete(msg.id)}
                    className={`p-2 rounded-lg transition-colors group ${theme === 'dark' ? 'hover:bg-red-500/20' : 'hover:bg-red-50'
                      }`}
                    title="Delete Message"
                  >
                    <Trash2 className={`w-5 h-5 ${theme === 'dark' ? 'text-white opacity-70 group-hover:text-red-400' : 'text-gray-600 group-hover:text-red-600'}`} />
                  </button>
                  {/* Block User functionality not yet implemented in API */}
                  <button
                    className={`p-2 rounded-lg transition-colors group ${theme === 'dark' ? 'hover:bg-orange-500/20' : 'hover:bg-orange-50'
                      }`}
                    title="Block User"
                  >
                    <Ban className={`w-5 h-5 ${theme === 'dark' ? 'text-white opacity-70 group-hover:text-orange-400' : 'text-gray-600 group-hover:text-orange-600'}`} />
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