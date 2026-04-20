import { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut, Menu, Moon, Search, Sun, User } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useRole } from '../contexts/RoleContext';

interface HeaderProps {
  onLogout: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onMenuToggle: () => void;
}

export function Header({ onLogout, searchQuery, onSearchChange, onMenuToggle }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { role } = useRole();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className={`${theme === 'dark' ? 'bg-[#1A1A1A] border-[#333333]' : 'bg-white border-gray-200'} border-b px-4 py-4 sm:px-6`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3 md:flex-1 md:max-w-2xl">
          <button
            type="button"
            onClick={onMenuToggle}
            className={`rounded-xl p-3 md:hidden ${theme === 'dark' ? 'hover:bg-[#2A2A2A]' : 'hover:bg-gray-100'} transition-colors`}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="relative flex-1">
            <Search className={`absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Search profiles, billing, complaints, services, SOS, or notices..."
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              className={`w-full rounded-xl border py-3 pl-12 pr-4 ${theme === 'dark'
                ? 'bg-[#1F1F1F] border-[#333333] text-[#F2F2F2] placeholder-gray-500 focus:border-[#57cf85]'
                : 'bg-white border-gray-200 text-slate-900 placeholder-slate-400 focus:border-[#57cf85]'
                } focus:outline-none focus:ring-2 focus:ring-[#57cf85]/20`}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 md:ml-6 md:justify-end">
          <button
            onClick={toggleTheme}
            className={`rounded-xl p-3 ${theme === 'dark' ? 'hover:bg-[#2A2A2A]' : 'hover:bg-gray-100'} transition-colors`}
          >
            {theme === 'light' ? <Sun className="h-5 w-5 text-gray-600" /> : <Moon className="h-5 w-5 text-white/70" />}
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown((prev) => !prev)}
              className={`flex items-center gap-2 rounded-xl border-l py-1 pl-3 pr-2 ${theme === 'dark' ? 'border-[#333333] hover:bg-[#2A2A2A]' : 'border-gray-200 hover:bg-gray-50'} transition-colors`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#57cf85]">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="hidden text-left sm:block">
                <p className={`font-medium ${theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>
                  {role === 'superadmin' ? 'Super Admin' : 'Admin'}
                </p>
              </div>
              <ChevronDown className={`h-4 w-4 ${showDropdown ? 'rotate-180' : ''} ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} transition-transform`} />
            </button>

            {showDropdown ? (
              <div className={`absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-xl border shadow-lg ${theme === 'dark' ? 'bg-[#1F1F1F] border-[#333333]' : 'bg-white border-gray-200'}`}>
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    onLogout();
                  }}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left ${theme === 'dark' ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'} transition-colors`}
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
