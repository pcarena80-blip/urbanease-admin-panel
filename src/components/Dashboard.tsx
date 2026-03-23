import { useState, useEffect } from 'react';
import { UserCircle, AlertTriangle, UserX, Bell, TrendingUp, Activity, RefreshCw, Loader2 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import { useRole } from '../contexts/RoleContext';
import api from '../services/api';

interface Stats {
  totalResidents: number;
  activeResidents: number;
  unverifiedResidents: number;
  activeComplaints: number;
  pendingComplaints: number;
  activeNotices: number;
}

interface GraphData {
  activityData: Array<{ time: string; logins: number; complaints: number; activity: number }>;
  resolutionData: Array<{ day: string; resolved: number; pending: number }>;
}

export function Dashboard() {
  const { theme } = useTheme();
  const { role } = useRole();
  const [loading, setLoading] = useState(true);
  const [graphLoading, setGraphLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [graphError, setGraphError] = useState<string | null>(null);

  const [stats, setStats] = useState<Stats>({
    totalResidents: 0,
    activeResidents: 0,
    unverifiedResidents: 0,
    activeComplaints: 0,
    pendingComplaints: 0,
    activeNotices: 0
  });

  const [graphData, setGraphData] = useState<GraphData>({
    activityData: [],
    resolutionData: []
  });

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/stats');
      setStats(response.data);
    } catch (err: any) {
      console.error("Failed to fetch dashboard stats", err);
      setError('Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const fetchGraphData = async () => {
    try {
      setGraphLoading(true);
      setGraphError(null);
      const response = await api.get('/admin/stats/graphs');
      setGraphData(response.data);
    } catch (err: any) {
      console.error("Failed to fetch graph data", err);
      setGraphError('Failed to load graphs');
    } finally {
      setGraphLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchGraphData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Loading skeleton for cards
  const CardSkeleton = () => (
    <div className={`${theme === 'dark' ? 'bg-[#1F1F1F]' : 'bg-white'} rounded-xl p-6 animate-pulse`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${theme === 'dark' ? 'bg-[#2A2A2A]' : 'bg-gray-200'}`}></div>
      </div>
      <div className={`h-8 w-16 ${theme === 'dark' ? 'bg-[#2A2A2A]' : 'bg-gray-200'} rounded mb-2`}></div>
      <div className={`h-4 w-24 ${theme === 'dark' ? 'bg-[#2A2A2A]' : 'bg-gray-200'} rounded`}></div>
    </div>
  );

  // Loading skeleton for graphs
  const GraphSkeleton = () => (
    <div className={`${theme === 'dark' ? 'bg-[#1F1F1F]' : 'bg-white'} rounded-xl p-6 animate-pulse`}>
      <div className={`h-6 w-40 ${theme === 'dark' ? 'bg-[#2A2A2A]' : 'bg-gray-200'} rounded mb-4`}></div>
      <div className={`h-64 ${theme === 'dark' ? 'bg-[#2A2A2A]' : 'bg-gray-200'} rounded`}></div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#00c878] to-[#00e68a] rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl mb-2">{getGreeting()}, {role === 'superadmin' ? 'Super Admin' : 'Admin'}!</h1>
            <p className="text-white/90 mb-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p className="text-white/80 italic">Convenience Meets Community</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-4">
              <p className="text-white/80 text-sm mb-1">Active Residents</p>
              <p className="text-2xl">{loading ? '--' : stats.activeResidents}</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-4">
              <p className="text-white/80 text-sm mb-1">System Status</p>
              <p className="text-xl flex items-center gap-2">
                <Activity className="w-5 h-5" />
                All Good
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {error ? (
        <div className={`${theme === 'dark' ? 'bg-red-900/20' : 'bg-red-50'} rounded-xl p-6 text-center`}>
          <p className={`${theme === 'dark' ? 'text-red-400' : 'text-red-600'} mb-3`}>{error}</p>
          <button onClick={fetchStats} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg mx-auto hover:bg-red-700">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-6">
          {loading ? (
            <>
              <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
            </>
          ) : (
            <>
              {/* Total Residents */}
              <div className={`${theme === 'dark' ? 'bg-[#1F1F1F] border-[#333333]' : 'bg-white border-gray-100'} rounded-xl p-6 shadow-sm border`}>
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 ${theme === 'dark' ? 'bg-[#2A2A2A]' : 'bg-green-50'} rounded-xl`}>
                    <UserCircle className={`w-6 h-6 ${theme === 'dark' ? 'text-white opacity-70' : 'text-[#00c878]'}`} />
                  </div>
                  <div className="flex items-center gap-1 text-green-600 text-sm">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <p className={`text-3xl mb-1 ${theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>{stats.totalResidents}</p>
                <p className={`mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Total Residents</p>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>verified</p>
              </div>

              {/* Unverified Residents */}
              <div className={`${theme === 'dark' ? 'bg-[#1F1F1F] border-[#333333]' : 'bg-white border-gray-100'} rounded-xl p-6 shadow-sm border`}>
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 ${theme === 'dark' ? 'bg-red-500/20' : 'bg-red-50'} rounded-xl`}>
                    <UserX className={`w-6 h-6 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`} />
                  </div>
                </div>
                <p className={`text-3xl font-bold mb-1 ${theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>{stats.unverifiedResidents}</p>
                <p className={`mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Unverified Residents</p>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>awaiting verification</p>
              </div>

              {/* Active Complaints */}
              <div className={`${theme === 'dark' ? 'bg-[#1F1F1F] border-[#333333]' : 'bg-white border-gray-100'} rounded-xl p-6 shadow-sm border`}>
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 ${theme === 'dark' ? 'bg-orange-500/20' : 'bg-orange-50'} rounded-xl`}>
                    <AlertTriangle className={`w-6 h-6 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-500'}`} />
                  </div>
                </div>
                <p className={`text-3xl mb-1 ${theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>{stats.activeComplaints}</p>
                <p className={`mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Active Complaints</p>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>{stats.pendingComplaints} pending</p>
              </div>

              {/* Active Notices */}
              <div className={`${theme === 'dark' ? 'bg-[#1F1F1F] border-[#333333]' : 'bg-white border-gray-100'} rounded-xl p-6 shadow-sm border`}>
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 ${theme === 'dark' ? 'bg-purple-500/20' : 'bg-purple-50'} rounded-xl`}>
                    <Bell className={`w-6 h-6 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-500'}`} />
                  </div>
                </div>
                <p className={`text-3xl mb-1 ${theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>{stats.activeNotices}</p>
                <p className={`mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Active Notices</p>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>posted on board</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Graphs */}
      {graphError ? (
        <div className={`${theme === 'dark' ? 'bg-red-900/20' : 'bg-red-50'} rounded-xl p-6 text-center`}>
          <p className={`${theme === 'dark' ? 'text-red-400' : 'text-red-600'} mb-3`}>{graphError}</p>
          <button onClick={fetchGraphData} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg mx-auto hover:bg-red-700">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {graphLoading ? (
            <>
              <GraphSkeleton /><GraphSkeleton />
            </>
          ) : (
            <>
              {/* Platform Activity Graph */}
              <div className={`${theme === 'dark' ? 'bg-[#1F1F1F] border-[#333333]' : 'bg-white border-gray-100'} rounded-xl p-6 shadow-sm border`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg ${theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>Platform Activity (24h)</h3>
                  <button onClick={fetchGraphData} className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-[#2A2A2A]' : 'hover:bg-gray-100'}`}>
                    <RefreshCw className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                  </button>
                </div>
                {graphData.activityData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center">
                    <p className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>No activity data available</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={graphData.activityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#333333' : '#f0f0f0'} />
                      <XAxis dataKey="time" stroke={theme === 'dark' ? '#999' : '#999'} fontSize={12} />
                      <YAxis stroke={theme === 'dark' ? '#999' : '#999'} fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? '#1F1F1F' : '#fff',
                          border: `1px solid ${theme === 'dark' ? '#333333' : '#e5e7eb'}`,
                          color: theme === 'dark' ? '#F2F2F2' : '#000',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="logins" name="Logins" stroke="#00c878" strokeWidth={2} dot={{ fill: '#00c878', r: 4 }} />
                      <Line type="monotone" dataKey="complaints" name="Complaints" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316', r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Complaint Resolution Graph */}
              <div className={`${theme === 'dark' ? 'bg-[#1F1F1F] border-[#333333]' : 'bg-white border-gray-100'} rounded-xl p-6 shadow-sm border`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg ${theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>Complaint Resolution (Weekly)</h3>
                  <button onClick={fetchGraphData} className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-[#2A2A2A]' : 'hover:bg-gray-100'}`}>
                    <RefreshCw className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                  </button>
                </div>
                {graphData.resolutionData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center">
                    <p className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>No resolution data available</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={graphData.resolutionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#333333' : '#f0f0f0'} />
                      <XAxis dataKey="day" stroke={theme === 'dark' ? '#999' : '#999'} fontSize={12} />
                      <YAxis stroke={theme === 'dark' ? '#999' : '#999'} fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? '#1F1F1F' : '#fff',
                          border: `1px solid ${theme === 'dark' ? '#333333' : '#e5e7eb'}`,
                          color: theme === 'dark' ? '#F2F2F2' : '#000',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="resolved" name="Resolved" fill="#00c878" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="pending" name="Pending" fill={theme === 'dark' ? '#555555' : '#e0e0e0'} radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}