import { useState, useEffect } from 'react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { RoleProvider } from './contexts/RoleContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Residents } from './components/Residents';
import { CarpoolManagement } from './components/CarpoolManagement';
import { Complaints } from './components/Complaints';
import { Announcements } from './components/Announcements';
import { ChatModeration } from './components/ChatModeration';
import { Settings } from './components/Settings';
import { Login } from './components/Login';

function AppContent() {
  const [activePage, setActivePage] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { theme } = useTheme();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  // Clear search when switching pages
  useEffect(() => {
    setSearchQuery('');
  }, [activePage]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setIsAuthenticated(false);
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'residents':
        return <Residents searchQuery={searchQuery} />;
      case 'carpool':
        return <CarpoolManagement />;
      case 'complaints':
        return <Complaints searchQuery={searchQuery} />;
      case 'announcements':
        return <Announcements searchQuery={searchQuery} />;
      case 'chat':
        return <ChatModeration />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className={`flex h-screen ${theme === 'dark' ? 'bg-[#0D0D0D]' : 'bg-gray-50'}`}>
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onLogout={handleLogout} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <main className="flex-1 overflow-y-auto p-6">
          {renderPage()}
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