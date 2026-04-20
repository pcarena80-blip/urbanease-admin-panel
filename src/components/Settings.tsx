import { useState, useEffect } from 'react';
import { User, Lock, LogOut, Mail, Phone, Plus, KeyRound, Trash2, UserPlus, Shield } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useRole } from '../contexts/RoleContext';
import api from '../services/api';

export function Settings() {
  const { theme } = useTheme();
  const { role } = useRole();

  // Profile data from localStorage
  const [profileData, setProfileData] = useState({ name: '', email: '', phone: '' });

  // Admin management
  const [adminAccounts, setAdminAccounts] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addMessage, setAddMessage] = useState({ text: '', type: '' });

  // Change password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMessage, setPwdMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const adminUser = localStorage.getItem('adminUser');
    if (adminUser) {
      try {
        const user = JSON.parse(adminUser);
        setProfileData({
          name: user.name || '',
          email: user.email || '',
          phone: '03010816321'
        });
      } catch (e) {
        console.error('Failed to parse adminUser', e);
      }
    }

    if (role === 'superadmin') {
      fetchAdmins();
    }
  }, [role]);

  const fetchAdmins = async () => {
    try {
      const response = await api.get('/admin/admins');
      setAdminAccounts(response.data);
    } catch (error) {
      console.error('Failed to fetch admins');
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAddMessage({ text: '', type: '' });
    try {
      await api.post('/admin/admins', {
        name: 'Admin',
        email: newEmail,
        password: newPassword
      });
      setShowAddModal(false);
      fetchAdmins();
      setNewEmail('');
      setNewPassword('');
      setAddMessage({ text: 'Admin account created successfully!', type: 'success' });
    } catch (error: any) {
      setAddMessage({ text: error.response?.data?.message || 'Failed to add admin', type: 'error' });
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    if (!confirm('Are you sure you want to remove this admin?')) return;
    try {
      await api.delete(`/admin/admins/${id}`);
      fetchAdmins();
    } catch (error) {
      alert('Failed to delete admin');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMessage({ text: '', type: '' });

    if (newPwd !== confirmPwd) {
      setPwdMessage({ text: 'New passwords do not match', type: 'error' });
      return;
    }

    if (newPwd.length < 6) {
      setPwdMessage({ text: 'New password must be at least 6 characters', type: 'error' });
      return;
    }

    setPwdLoading(true);
    try {
      const response = await api.put('/admin/change-password', {
        currentPassword,
        newPassword: newPwd
      });
      setPwdMessage({ text: response.data.message || 'Password updated successfully!', type: 'success' });
      setCurrentPassword('');
      setNewPwd('');
      setConfirmPwd('');
    } catch (error: any) {
      setPwdMessage({ text: error.response?.data?.message || 'Failed to update password', type: 'error' });
    } finally {
      setPwdLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`text-2xl ${theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>Settings</h2>
        <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Manage your admin profile and preferences</p>
      </div>

      {/* Profile Section */}
      <div className={`${theme === 'dark' ? 'bg-[#1F1F1F] border-[#333333]' : 'bg-white border-gray-100'} rounded-xl p-6 shadow-sm border`}>
        <h3 className={`text-lg mb-4 ${theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>
          {role === 'superadmin' ? 'Super Admin Profile' : 'Admin Profile'}
        </h3>
        <div className="flex items-start gap-6 mb-6">
          <div className="w-24 h-24 rounded-full bg-[#57cf85] flex items-center justify-center text-white text-3xl">
            {role === 'superadmin' ? 'SA' : 'A'}
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <label className={`block mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Full Name</label>
              <div className="relative">
                <User className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-white opacity-40' : 'text-gray-400'}`} />
                <input
                  type="text"
                  value={profileData.name}
                  readOnly
                  className={`w-full pl-12 pr-4 py-3 rounded-lg border ${theme === 'dark'
                    ? 'bg-[#1A1A1A] border-[#333333] text-[#F2F2F2]'
                    : 'bg-gray-50 border-gray-200 text-gray-600'
                    }`}
                />
              </div>
            </div>
            <div>
              <label className={`block mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
              <div className="relative">
                <Mail className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-white opacity-40' : 'text-gray-400'}`} />
                <input
                  type="email"
                  value={profileData.email}
                  readOnly
                  className={`w-full pl-12 pr-4 py-3 rounded-lg border ${theme === 'dark'
                    ? 'bg-[#1A1A1A] border-[#333333] text-[#F2F2F2]'
                    : 'bg-gray-50 border-gray-200 text-gray-600'
                    }`}
                />
              </div>
            </div>
            <div>
              <label className={`block mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Phone</label>
              <div className="relative">
                <Phone className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-white opacity-40' : 'text-gray-400'}`} />
                <input
                  type="tel"
                  value={profileData.phone}
                  readOnly
                  className={`w-full pl-12 pr-4 py-3 rounded-lg border ${theme === 'dark'
                    ? 'bg-[#1A1A1A] border-[#333333] text-[#F2F2F2]'
                    : 'bg-gray-50 border-gray-200 text-gray-600'
                    }`}
                />
              </div>
            </div>
            <div>
              <label className={`block mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Role</label>
              <input
                type="text"
                value={role === 'superadmin' ? 'Super Admin' : 'Admin'}
                disabled
                className={`w-full px-4 py-3 rounded-lg border ${theme === 'dark'
                  ? 'bg-[#1A1A1A] border-[#333333] text-gray-400'
                  : 'bg-gray-50 border-gray-200 text-gray-600'
                  }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Section */}
      <div className={`${theme === 'dark' ? 'bg-[#1F1F1F] border-[#333333]' : 'bg-white border-gray-100'} rounded-xl p-6 shadow-sm border`}>
        <div className="flex items-center gap-2 mb-4">
          <KeyRound className="w-5 h-5 text-[#57cf85]" />
          <h3 className={`text-lg ${theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>Change Password</h3>
        </div>

        {pwdMessage.text && (
          <div className={`p-3 rounded-lg mb-4 text-sm ${pwdMessage.type === 'success'
            ? (theme === 'dark' ? 'border-[#57cf85]/20 bg-[#57cf85]/12 text-[#57cf85]' : 'border-[#57cf85]/20 bg-[#57cf85]/12 text-[#57cf85]')
            : (theme === 'dark' ? 'bg-red-900/30 text-red-400 border border-red-800' : 'bg-red-50 text-red-700 border border-red-200')
            }`}>
            {pwdMessage.text}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
          <div>
            <label className={`block mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Current Password</label>
            <div className="relative">
              <Lock className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-white opacity-40' : 'text-gray-400'}`} />
              <input
                type="password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
                className={`w-full pl-12 pr-4 py-3 rounded-lg border ${theme === 'dark'
                  ? 'bg-[#1A1A1A] border-[#333333] text-[#F2F2F2] placeholder-gray-500 focus:border-[#57cf85]'
                  : 'bg-white border-gray-200 focus:border-[#57cf85]'
                  } focus:outline-none focus:ring-2 focus:ring-[#57cf85]/20`}
              />
            </div>
          </div>
          <div>
            <label className={`block mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>New Password</label>
            <div className="relative">
              <Lock className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-white opacity-40' : 'text-gray-400'}`} />
              <input
                type="password"
                placeholder="Enter new password"
                value={newPwd}
                onChange={e => setNewPwd(e.target.value)}
                required
                className={`w-full pl-12 pr-4 py-3 rounded-lg border ${theme === 'dark'
                  ? 'bg-[#1A1A1A] border-[#333333] text-[#F2F2F2] placeholder-gray-500 focus:border-[#57cf85]'
                  : 'bg-white border-gray-200 focus:border-[#57cf85]'
                  } focus:outline-none focus:ring-2 focus:ring-[#57cf85]/20`}
              />
            </div>
          </div>
          <div>
            <label className={`block mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Confirm New Password</label>
            <div className="relative">
              <Lock className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-white opacity-40' : 'text-gray-400'}`} />
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPwd}
                onChange={e => setConfirmPwd(e.target.value)}
                required
                className={`w-full pl-12 pr-4 py-3 rounded-lg border ${theme === 'dark'
                  ? 'bg-[#1A1A1A] border-[#333333] text-[#F2F2F2] placeholder-gray-500 focus:border-[#57cf85]'
                  : 'bg-white border-gray-200 focus:border-[#57cf85]'
                  } focus:outline-none focus:ring-2 focus:ring-[#57cf85]/20`}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={pwdLoading}
            className="px-6 py-3 bg-[#57cf85] text-white rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50"
          >
            {pwdLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Create Admin Section - Super Admin Only */}
      {role === 'superadmin' && (
        <div className={`${theme === 'dark' ? 'bg-[#1F1F1F] border-[#333333]' : 'bg-white border-gray-100'} rounded-xl p-6 shadow-sm border`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#57cf85]" />
              <div>
                <h3 className={`text-lg ${theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>
                  Create Admin Account
                </h3>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Super Admin Only — Create and manage admin accounts
                </p>
              </div>
            </div>
            <button
              onClick={() => { setShowAddModal(!showAddModal); setAddMessage({ text: '', type: '' }); }}
              className="flex items-center gap-2 px-4 py-3 bg-[#57cf85] text-white rounded-xl hover:shadow-lg transition-shadow">
              <UserPlus className="w-5 h-5" />
              {showAddModal ? 'Cancel' : 'Add New Admin'}
            </button>
          </div>

          {addMessage.text && (
            <div className={`p-3 rounded-lg mb-4 text-sm ${addMessage.type === 'success'
              ? (theme === 'dark' ? 'border-[#57cf85]/20 bg-[#57cf85]/12 text-[#57cf85]' : 'border-[#57cf85]/20 bg-[#57cf85]/12 text-[#57cf85]')
              : (theme === 'dark' ? 'bg-red-900/30 text-red-400 border border-red-800' : 'bg-red-50 text-red-700 border border-red-200')
              }`}>
              {addMessage.text}
            </div>
          )}

          {showAddModal && (
            <div className={`mb-6 p-5 rounded-xl border ${theme === 'dark' ? 'border-[#333333] bg-[#2A2A2A]' : 'border-gray-200 bg-gray-50'}`}>
              <h4 className={`text-sm font-medium mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Enter Admin Credentials</h4>
              <form onSubmit={handleAddAdmin} className="space-y-4 max-w-lg">
                <div>
                  <label className={`block mb-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Admin Email</label>
                  <div className="relative">
                    <Mail className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-white opacity-40' : 'text-gray-400'}`} />
                    <input
                      required
                      type="email"
                      autoComplete="off"
                      placeholder="admin@example.com"
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                      className={`w-full pl-12 pr-4 py-3 rounded-lg border ${theme === 'dark'
                        ? 'bg-[#1A1A1A] border-[#333333] text-[#F2F2F2] placeholder-gray-500 focus:border-[#57cf85]'
                        : 'bg-white border-gray-200 focus:border-[#57cf85]'
                        } focus:outline-none focus:ring-2 focus:ring-[#57cf85]/20`}
                    />
                  </div>
                </div>
                <div>
                  <label className={`block mb-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Admin Password</label>
                  <div className="relative">
                    <Lock className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-white opacity-40' : 'text-gray-400'}`} />
                    <input
                      required
                      type="password"
                      autoComplete="new-password"
                      placeholder="Set a password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className={`w-full pl-12 pr-4 py-3 rounded-lg border ${theme === 'dark'
                        ? 'bg-[#1A1A1A] border-[#333333] text-[#F2F2F2] placeholder-gray-500 focus:border-[#57cf85]'
                        : 'bg-white border-gray-200 focus:border-[#57cf85]'
                        } focus:outline-none focus:ring-2 focus:ring-[#57cf85]/20`}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex items-center gap-2 px-6 py-3 bg-[#57cf85] text-white rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  {addLoading ? 'Creating...' : 'Create Admin Account'}
                </button>
              </form>
            </div>
          )}

          {/* Existing admins table */}
          {adminAccounts.length > 0 && (
            <div className={`${theme === 'dark' ? 'border-[#333333]' : 'border-gray-100'} border rounded-xl overflow-hidden`}>
              <table className="w-full">
                <thead className={`${theme === 'dark' ? 'bg-[#1A1A1A] border-[#333333]' : 'bg-gray-50 border-gray-200'} border-b`}>
                  <tr>
                    <th className={`px-6 py-4 text-left ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Admin</th>
                    <th className={`px-6 py-4 text-left ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Email</th>
                    <th className={`px-6 py-4 text-left ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={`${theme === 'dark' ? 'divide-[#333333]' : 'divide-gray-200'} divide-y`}>
                  {adminAccounts.map((admin) => (
                    <tr key={admin._id} className={theme === 'dark' ? 'hover:bg-[#2A2A2A]' : 'hover:bg-gray-50'}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#57cf85] flex items-center justify-center text-white">
                            {admin.name?.charAt(0) || 'A'}
                          </div>
                          <span className={theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}>{admin.name}</span>
                        </div>
                      </td>
                      <td className={`px-6 py-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{admin.email}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDeleteAdmin(admin._id)}
                          className={`flex items-center gap-1 px-3 py-2 text-sm ${theme === 'dark' ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-100 text-red-700 hover:bg-red-200'} rounded-lg transition-colors`}>
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {adminAccounts.length === 0 && !showAddModal && (
            <p className={`text-center py-6 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
              No admin accounts created yet. Click "Add New Admin" to create one.
            </p>
          )}
        </div>
      )}

      {/* Logout Section */}
      <div className={`${theme === 'dark' ? 'bg-[#1F1F1F] border-[#333333]' : 'bg-white border-gray-100'} rounded-xl p-6 shadow-sm border`}>
        <h3 className={`text-lg mb-4 ${theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>Danger Zone</h3>
        <p className={`mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          Logging out will end your current session. You will need to log in again to access the admin panel.
        </p>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
