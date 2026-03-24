import { Home, Users, CreditCard, AlertTriangle, Bell, MessageSquare, Settings, Car, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useRole } from '../contexts/RoleContext';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ activePage, setActivePage, isOpen, onClose }: SidebarProps) {
  const { theme } = useTheme();
  const { role } = useRole();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'residents', label: 'Residents', icon: Users },
    { id: 'carpool', label: 'Carpooling', icon: Car }, // Replaced Bills
    { id: 'complaints', label: 'Complaints', icon: AlertTriangle },
    { id: 'announcements', label: 'E-Notice Board', icon: Bell },
    { id: 'chat', label: 'Chat Moderation', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ].filter(item => item.id !== 'settings' || role === 'superadmin');

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-black/40 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
      />
      <div className={`fixed inset-y-0 left-0 z-40 w-72 max-w-[85vw] -translate-x-full ${theme === 'dark' ? 'bg-[#1A1A1A] border-[#333333]' : 'bg-white border-gray-200'} border-r flex flex-col transition-transform duration-300 md:static md:z-auto md:w-64 md:max-w-none md:translate-x-0 ${isOpen ? 'translate-x-0' : ''}`}>
      <div className={`flex items-center justify-between p-5 sm:p-6 ${theme === 'dark' ? 'border-[#333333]' : 'border-gray-200'} border-b`}>
        <h1 className="text-lg sm:text-xl bg-gradient-to-r from-[#00c878] to-[#00e68a] bg-clip-text text-transparent">
          UrbanEase Admin
        </h1>
        <button
          type="button"
          onClick={onClose}
          className={`rounded-lg p-2 md:hidden ${theme === 'dark' ? 'hover:bg-[#2A2A2A]' : 'hover:bg-gray-100'}`}
          aria-label="Close navigation"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActivePage(item.id);
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                ? 'bg-gradient-to-r from-[#00c878] to-[#00e68a] text-white shadow-md'
                : theme === 'dark'
                  ? 'text-[#F2F2F2] hover:bg-[#2A2A2A]'
                  : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              <div className={`p-2 rounded-lg ${isActive ? 'bg-white/20' : theme === 'dark' ? 'bg-[#2A2A2A]' : 'bg-green-50'}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : theme === 'dark' ? 'text-white opacity-70' : 'text-[#00c878]'}`} />
              </div>
              <span className={isActive ? '' : ''}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
    </>
  );
}
