import { useState, useRef, useEffect } from 'react';
import { Search, Sun, Moon, User, LogOut, ChevronDown } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useRole } from '../contexts/RoleContext';

interface HeaderProps {
  onLogout: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function Header({ onLogout, searchQuery, onSearchChange }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { role } = useRole();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className={`${theme === 'dark' ? 'bg-[#1A1A1A] border-[#333333]' : 'bg-white border-gray-200'} border-b px-6 py-4`}>
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${theme === 'dark' ? 'text-white opacity-40' : 'text-gray-400'} w-5 h-5`} />
            <input
              type="text"
              placeholder="Search residents, complaints, or notices…"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className={`w-full pl-12 pr-4 py-3 rounded-xl border ${theme === 'dark'
                ? 'bg-[#1F1F1F] border-[#333333] text-[#F2F2F2] placeholder-gray-500 focus:border-[#00c878]'
                : 'bg-white border-gray-200 focus:border-[#00c878]'
                } focus:outline-none focus:ring-2 focus:ring-[#00c878]/20`}
            />
          </div>
        </div>
        <div className="flex items-center gap-4 ml-6">
          <button
            onClick={toggleTheme}
            className={`p-3 rounded-xl ${theme === 'dark' ? 'hover:bg-[#2A2A2A]' : 'hover:bg-gray-100'} transition-colors`}
          >
            {theme === 'light' ? (
              <Sun className="w-5 h-5 text-gray-600" />
            ) : (
              <Moon className="w-5 h-5 text-white opacity-70" />
            )}
          </button>

          {/* User dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className={`flex items-center gap-3 pl-4 py-1 pr-2 rounded-xl ${theme === 'dark' ? 'border-[#333333] hover:bg-[#2A2A2A]' : 'border-gray-200 hover:bg-gray-50'} border-l transition-colors`}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#00c878] to-[#00e68a] flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className={`font-medium ${theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>
                  {role === 'superadmin' ? 'Super Admin' : 'Admin'}
                </p>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''} ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
            </button>

            {showDropdown && (
              <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-lg border z-50 overflow-hidden ${theme === 'dark' ? 'bg-[#1F1F1F] border-[#333333]' : 'bg-white border-gray-200'
                }`}>
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    onLogout();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${theme === 'dark'
                      ? 'text-red-400 hover:bg-red-500/10'
                      : 'text-red-600 hover:bg-red-50'
                    }`}
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}