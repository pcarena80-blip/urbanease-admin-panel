import { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, Clock, History, Bell, AlertCircle, Upload } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';
import { useLiveRefresh } from './AdminShared';
import { resolveMediaUrl } from '../utils/media';

interface Notice {
  _id: string;
  title: string;
  description: string;
  expiryDate: string;
  createdAt: string;
  attachment?: string;
}

export function Announcements({ searchQuery = '' }: { searchQuery?: string }) {
  const { theme } = useTheme();
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [notices, setNotices] = useState<Notice[]>([]);
  const [historyNotices, setHistoryNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split('T')[0];

  const fetchNotices = async () => {
    try {
      if (!notices.length) {
        setLoading(true);
      }
      const response = await api.get('/admin/notices');
      setNotices(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Failed to fetch notices", error);
      setError('Failed to load notices');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoryNotices = async () => {
    try {
      setHistoryLoading(true);
      const response = await api.get('/admin/notices/history');
      setHistoryNotices(response.data);
    } catch (error) {
      console.error("Failed to fetch history notices", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history' && historyNotices.length === 0) {
      fetchHistoryNotices();
    }
  }, [activeTab, historyNotices.length]);

  useLiveRefresh(async () => {
    if (activeTab === 'history') {
      await fetchHistoryNotices();
      return;
    }

    await fetchNotices();
  }, 15000, [activeTab, notices.length, historyNotices.length]);

  const validateForm = (): boolean => {
    setFormError(null);

    if (!title.trim()) {
      setFormError('Title is required');
      return false;
    }
    if (!description.trim()) {
      setFormError('Description is required');
      return false;
    }
    if (!expiryDate) {
      setFormError('Expiry date is required');
      return false;
    }

    // Validate expiry date is not in the past
    const selectedDate = new Date(expiryDate);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < todayDate) {
      setFormError('Expiry date cannot be in the past');
      return false;
    }

    return true;
  };

  const handleCreateNotice = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      setFormError(null);

      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('expiryDate', expiryDate);
      if (selectedFile) {
        formData.append('file', selectedFile);
        console.log('Uploading file:', selectedFile.name, selectedFile.size, 'bytes');
      }

      const response = await api.post('/admin/notices', formData);
      console.log('Notice created:', response.data);

      setShowForm(false);
      setTitle('');
      setDescription('');
      setExpiryDate('');
      setSelectedFile(null);
      fetchNotices();
    } catch (error: any) {
      console.error("Failed to create notice", error);
      setFormError(error.response?.data?.message || error.message || "Failed to create notice");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNotice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notice?')) return;

    try {
      await api.delete(`/admin/notices/${id}`);
      if (activeTab === 'active') {
        fetchNotices();
      } else {
        fetchHistoryNotices();
      }
    } catch (error: any) {
      console.error("Failed to delete notice", error);
      alert(error.response?.data?.message || "Failed to delete notice");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const isExpired = (dateStr: string) => {
    return new Date(dateStr) < new Date();
  };

  const displayNotices = (activeTab === 'active' ? notices : historyNotices).filter((n) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return n.title?.toLowerCase().includes(q) || n.description?.toLowerCase().includes(q);
  });
  const isLoading = activeTab === 'active' ? loading : historyLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl ${theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>E-Notice Board</h2>
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Create and manage community announcements</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-3 bg-[#57cf85] text-white rounded-xl hover:shadow-lg transition-shadow"
        >
          <Plus className="w-5 h-5" />
          Create Announcement
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === 'active'
            ? 'bg-[#57cf85] text-white'
            : theme === 'dark'
              ? 'bg-[#2A2A2A] text-gray-300 hover:bg-[#333333]'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
        >
          <Bell className="w-4 h-4" />
          Active Notices ({notices.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === 'history'
            ? 'bg-[#57cf85] text-white'
            : theme === 'dark'
              ? 'bg-[#2A2A2A] text-gray-300 hover:bg-[#333333]'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
        >
          <History className="w-4 h-4" />
          📜 History ({historyNotices.length})
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className={`${theme === 'dark' ? 'bg-[#1F1F1F] border-[#333333]' : 'bg-white border-gray-100'} rounded-xl p-6 shadow-sm border`}>
          <h3 className={`text-lg mb-4 ${theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>New Announcement</h3>

          {formError && (
            <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${theme === 'dark' ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
              <AlertCircle className="w-5 h-5" />
              {formError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className={`block mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter announcement title"
                className={`w-full px-4 py-3 rounded-lg border ${theme === 'dark'
                  ? 'bg-[#1A1A1A] border-[#333333] text-[#F2F2F2] placeholder-gray-500 focus:border-[#57cf85]'
                  : 'bg-white border-gray-200 focus:border-[#57cf85]'
                  } focus:outline-none focus:ring-2 focus:ring-[#57cf85]/20`}
              />
            </div>
            <div>
              <label className={`block mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Description *</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter announcement details"
                className={`w-full px-4 py-3 rounded-lg border ${theme === 'dark'
                  ? 'bg-[#1A1A1A] border-[#333333] text-[#F2F2F2] placeholder-gray-500 focus:border-[#57cf85]'
                  : 'bg-white border-gray-200 focus:border-[#57cf85]'
                  } focus:outline-none focus:ring-2 focus:ring-[#57cf85]/20`}
              ></textarea>
            </div>

            <div>
              <label className={`block mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Attachment (Image)</label>
              <div className={`border-2 border-dashed rounded-lg p-4 ${theme === 'dark' ? 'border-[#333333] bg-[#1A1A1A]' : 'border-gray-200 bg-gray-50'}`}>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/gif, image/webp, image/bmp"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                  id="notice-file"
                />
                <label htmlFor="notice-file" className="flex flex-col items-center justify-center cursor-pointer">
                  <Upload className={`w-8 h-8 mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                  <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {selectedFile ? selectedFile.name : 'Click to upload an image'}
                  </span>
                </label>
              </div>
            </div>
            <div>
              <label className={`block mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Expiry Date *</label>
              <input
                type="date"
                value={expiryDate}
                min={today}
                onChange={(e) => setExpiryDate(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border ${theme === 'dark'
                  ? 'bg-[#1A1A1A] border-[#333333] text-[#F2F2F2] focus:border-[#57cf85]'
                  : 'bg-white border-gray-200 focus:border-[#57cf85]'
                  } focus:outline-none focus:ring-2 focus:ring-[#57cf85]/20`}
              />
              <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                Notice will move to history after this date
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCreateNotice}
                disabled={submitting}
                className={`px-6 py-3 bg-[#57cf85] text-white rounded-lg hover:shadow-lg transition-shadow ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}>
                {submitting ? 'Publishing...' : 'Publish Announcement'}
              </button>
              <button
                onClick={() => { setShowForm(false); setFormError(null); }}
                className={`px-6 py-3 ${theme === 'dark' ? 'bg-[#2A2A2A] text-gray-300 hover:bg-[#333333]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} rounded-lg transition-colors`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notices List */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-8">
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Loading notices...</p>
          </div>
        ) : displayNotices.length === 0 ? (
          <div className={`text-center py-12 ${theme === 'dark' ? 'bg-[#1F1F1F]' : 'bg-gray-50'} rounded-xl`}>
            <History className={`w-12 h-12 mx-auto mb-3 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-300'}`} />
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
              {activeTab === 'active' ? 'No active notices' : 'No expired notices in history'}
            </p>
          </div>
        ) : (
          displayNotices.map((notice) => (
            <div key={notice._id} className={`${theme === 'dark' ? 'bg-[#1F1F1F] border-[#333333]' : 'bg-white border-gray-100'} rounded-xl p-6 shadow-sm border ${activeTab === 'history' ? 'opacity-70' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className={`text-lg ${theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>{notice.title}</h3>
                    {activeTab === 'history' && (
                      <span className={`text-xs px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'}`}>
                        Expired
                      </span>
                    )}
                  </div>
                  <p className={`mb-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{notice.description}</p>

                  {/* Attachment Image */}
                  {notice.attachment && (() => {
                    const imgUrl = resolveMediaUrl(notice.attachment);
                    console.log('Image URL for notice', notice.title, ':', imgUrl);
                    return (
                      <div className="mb-3">
                        <img
                          src={imgUrl}
                          alt="Notice attachment"
                          className="max-h-48 rounded-lg object-cover border border-gray-200"
                          onError={(e) => {
                            console.error('Image failed to load:', imgUrl);
                            const el = e.target as HTMLImageElement;
                            el.style.border = '2px solid red';
                            el.style.padding = '8px';
                            el.alt = `Failed to load: ${imgUrl}`;
                          }}
                        />
                      </div>
                    );
                  })()}

                  <div className={`flex items-center gap-4 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Created: {formatDate(notice.createdAt)}</span>
                    </div>
                    <div className={`flex items-center gap-2 ${isExpired(notice.expiryDate) ? 'text-red-500' : ''}`}>
                      <Clock className="w-4 h-4" />
                      <span>{isExpired(notice.expiryDate) ? 'Expired' : 'Expires'}: {formatDate(notice.expiryDate)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDeleteNotice(notice._id)}
                    className={`p-2 ${theme === 'dark' ? 'hover:bg-red-500/20' : 'hover:bg-red-50'} rounded-lg transition-colors`}>
                    <Trash2 className={`w-5 h-5 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} />
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
