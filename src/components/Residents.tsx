import { useState, useEffect } from 'react';
import { Plus, MoreVertical, CheckCircle, XCircle, AlertCircle, Check, X, Eye, Trash2, MessageCircleOff, MessageCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  cnic: string;
  propertyType: string;
  ownership: string;
  block?: string;
  street?: string;
  houseNo?: string;
  plazaName?: string;
  floorNumber?: string;
  flatNumber?: string;
  isVerified: boolean;
  isChatBlocked?: boolean;
}

export function Residents({ searchQuery = '' }: { searchQuery?: string }) {
  const { theme } = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      console.log('Fetching users from /admin/users...');
      const response = await api.get('/admin/users');
      console.log('API Response:', response.data);
      if (Array.isArray(response.data)) {
        setUsers(response.data);
      } else {
        console.error('Data is not an array:', response.data);
        setError('Invalid data format received');
      }
    } catch (err: any) {
      console.error('Failed to fetch users', err);
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleVerify = async (userId: string, isVerified: boolean) => {
    try {
      await api.put(`/admin/users/${userId}/verify`, { isVerified });
      // Refresh list locally
      setUsers(users.map(user => user._id === userId ? { ...user, isVerified } : user));
    } catch (error) {
      console.error("Failed to update user verification", error);
      alert("Failed to update user verification status");
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${userName}? This will also delete all their complaints, messages, and carpool listings. This action cannot be undone.`)) {
      return;
    }
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(users.filter(user => user._id !== userId));
      alert(`User ${userName} and all associated data have been deleted.`);
    } catch (error: any) {
      console.error("Failed to delete user", error);
      alert(error.response?.data?.message || "Failed to delete user");
    }
  };

  const handleToggleChatBlock = async (userId: string, currentlyBlocked: boolean) => {
    try {
      await api.put(`/admin/users/${userId}/chat-block`, { block: !currentlyBlocked });
      setUsers(users.map(user => user._id === userId ? { ...user, isChatBlocked: !currentlyBlocked } : user));
      alert(currentlyBlocked ? 'User can now send chat messages.' : 'User has been blocked from sending chat messages.');
    } catch (error: any) {
      console.error("Failed to toggle chat block", error);
      alert(error.response?.data?.message || "Failed to update chat block status");
    }
  };

  const getStatus = (user: User) => {
    return user.isVerified ? 'active' : 'pending';
  };

  const getStatusBadge = (isVerified: boolean) => {
    if (isVerified) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-50 text-green-600 text-sm">
          <CheckCircle className="w-4 h-4" />
          Verified
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-50 text-yellow-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          Pending
        </span>
      );
    }
  };

  const getAddress = (user: User) => {
    if (user.propertyType === 'house') {
      return `House ${user.houseNo}, Street ${user.street}, Block ${user.block}`;
    } else {
      return `Flat ${user.flatNumber}, Floor ${user.floorNumber}, Plaza ${user.plazaName}`;
    }
  };

  const getActionButtons = (user: User) => {
    return (
      <div className="flex gap-2 flex-wrap">
        {!user.isVerified ? (
          <button
            onClick={() => handleVerify(user._id, true)}
            className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            title="Verify User"
          >
            <Check className="w-4 h-4" />
            Verify
          </button>
        ) : (
          <button
            onClick={() => handleVerify(user._id, false)}
            className="flex items-center gap-1 px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors text-sm"
            title="Unverify User"
          >
            <XCircle className="w-4 h-4" />
            Unverify
          </button>
        )}
        {user.isVerified && (
          <button
            onClick={() => handleToggleChatBlock(user._id, user.isChatBlocked || false)}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors text-sm ${user.isChatBlocked
              ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            title={user.isChatBlocked ? 'Unblock from Chat' : 'Block from Chat'}
          >
            {user.isChatBlocked ? <MessageCircle className="w-4 h-4" /> : <MessageCircleOff className="w-4 h-4" />}
            {user.isChatBlocked ? 'Unblock Chat' : 'Block Chat'}
          </button>
        )}
        <button
          onClick={() => handleDeleteUser(user._id, user.name)}
          className="flex items-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
          title="Delete User"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </div>
    );
  };

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl ${theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>Residents Management</h2>
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Manage all registered residents in the community</p>
          <p className="text-xs text-gray-400 mt-1">Debug: Loaded {users.length} users.</p>
        </div>
      </div>

      <div className={`${theme === 'dark' ? 'bg-[#1F1F1F] border-[#333333]' : 'bg-white border-gray-100'} rounded-xl shadow-sm border overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${theme === 'dark' ? 'bg-[#1A1A1A] border-[#333333]' : 'bg-gray-50 border-gray-200'} border-b`}>
              <tr>
                <th className={`px-6 py-4 text-left ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Full Name</th>
                <th className={`px-6 py-4 text-left ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Phone Number</th>
                <th className={`px-6 py-4 text-left ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>CNIC</th>
                <th className={`px-6 py-4 text-left ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Full Address</th>
                <th className={`px-6 py-4 text-left ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Account Status</th>
                <th className={`px-6 py-4 text-left ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Actions</th>
              </tr>
            </thead>
            <tbody className={`${theme === 'dark' ? 'divide-[#333333]' : 'divide-gray-200'} divide-y`}>
              {loading ? (
                <tr><td colSpan={6} className="text-center p-4">Loading users...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="text-center p-4">No residents found.</td></tr>
              ) : users.filter(u => {
                if (!searchQuery) return true;
                const q = searchQuery.toLowerCase();
                return (
                  u.name?.toLowerCase().includes(q) ||
                  u.email?.toLowerCase().includes(q) ||
                  u.phone?.toLowerCase().includes(q) ||
                  u.cnic?.toLowerCase().includes(q)
                );
              }).map((user) => (
                <tr key={user._id} className={theme === 'dark' ? 'hover:bg-[#2A2A2A]' : 'hover:bg-gray-50'}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#00c878] to-[#00e68a] flex items-center justify-center text-white">
                        {user.name ? user.name.charAt(0) : '?'}
                      </div>
                      <span className={theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}>{user.name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className={`px-6 py-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{user.phone || 'N/A'}</td>
                  <td className={`px-6 py-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{user.cnic || 'N/A'}</td>
                  <td className={`px-6 py-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    {getAddress(user)}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(user.isVerified)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getActionButtons(user)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}