import { Suspense, lazy, useEffect, useState } from 'react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { RoleProvider } from './contexts/RoleContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Settings } from './components/Settings';
import { Login } from './components/Login';

const DashboardPage = lazy(() =>
  import('./components/Dashboard').then((module) => ({ default: module.Dashboard })),
);
const ProfilesManagementPage = lazy(() =>
  import('./components/ProfilesManagement').then((module) => ({ default: module.ProfilesManagement })),
);
const BillsPaymentsPage = lazy(() =>
  import('./components/BillsPayments').then((module) => ({ default: module.BillsPayments })),
);
const CarpoolManagementPage = lazy(() =>
  import('./components/CarpoolManagement').then((module) => ({ default: module.CarpoolManagement })),
);
const ComplaintsPage = lazy(() =>
  import('./components/Complaints').then((module) => ({ default: module.Complaints })),
);
const AnnouncementsPage = lazy(() =>
  import('./components/Announcements').then((module) => ({ default: module.Announcements })),
);
const ChatModerationPage = lazy(() =>
  import('./components/ChatModeration').then((module) => ({ default: module.ChatModeration })),
);
const CommunityOperationsPage = lazy(() =>
  import('./components/CommunityOperations').then((module) => ({ default: module.CommunityOperations })),
);

function AppContent() {
  const [activePage, setActivePage] = useState('dashboard');
  const [authState, setAuthState] = useState<'checking' | 'authenticated' | 'logged_out'>('checking');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    setAuthState(token ? 'authenticated' : 'logged_out');
  }, []);

  // Clear search when switching pages
  useEffect(() => {
    setSearchQuery('');
    setIsSidebarOpen(false);
  }, [activePage]);

  const handleLoginSuccess = () => {
    setAuthState('authenticated');
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setAuthState('logged_out');
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'profiles':
        return <ProfilesManagementPage searchQuery={searchQuery} />;
      case 'finance':
        return <BillsPaymentsPage searchQuery={searchQuery} />;
      case 'carpool':
        return <CarpoolManagementPage />;
      case 'complaints':
        return <ComplaintsPage searchQuery={searchQuery} />;
      case 'announcements':
        return <AnnouncementsPage searchQuery={searchQuery} />;
      case 'chat':
        return <ChatModerationPage />;
      case 'ops':
        return <CommunityOperationsPage searchQuery={searchQuery} />;
      case 'settings':
        return <Settings />;
      default:
        return <DashboardPage />;
    }
  };

  if (authState === 'checking') {
    return (
      <div className={`flex min-h-screen items-center justify-center ${theme === 'dark' ? 'bg-[#0D0D0D]' : 'bg-gray-50'}`}>
        <div className={`rounded-3xl border px-8 py-6 shadow-sm ${theme === 'dark' ? 'border-[#333333] bg-[#1A1A1A] text-[#F2F2F2]' : 'border-gray-200 bg-white text-slate-900'}`}>
          <p className="text-sm font-medium">Restoring your admin session...</p>
        </div>
      </div>
    );
  }

  if (authState !== 'authenticated') {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className={`flex min-h-screen ${theme === 'dark' ? 'bg-[#0D0D0D]' : 'bg-gray-50'}`}>
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="flex-1 flex min-w-0 flex-col overflow-hidden">
        <Header
          onLogout={handleLogout}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onMenuToggle={() => setIsSidebarOpen((prev) => !prev)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Suspense
            fallback={
              <div
                className={`flex min-h-[220px] items-center justify-center rounded-3xl border px-8 py-6 ${
                  theme === 'dark'
                    ? 'border-[#333333] bg-[#1A1A1A] text-[#F2F2F2]'
                    : 'border-gray-200 bg-white text-slate-900'
                }`}
              >
                <p className="text-sm font-medium">Loading admin module...</p>
              </div>
            }
          >
            {renderPage()}
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <RoleProvider>
        <AppContent />
      </RoleProvider>
    </ThemeProvider>
  );
}
