import { useState } from 'react';
import axios from 'axios';
import { AlertTriangle, Bell, Building2, CalendarDays, CreditCard, LifeBuoy, RefreshCw, ShoppingBag, UserCircle, UserCog, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import { useRole } from '../contexts/RoleContext';
import api from '../services/api';
import { getApiErrorMessage } from '../utils/apiErrors';
import { AdminPanel, ApiStatusBanner, PageIntro, StatusBadge, getAdminTheme, useLiveRefresh } from './AdminShared';

type Stats = {
  totalResidents: number;
  activeResidents: number;
  unverifiedResidents: number;
  totalProviders: number;
  pendingProviders: number;
  activeComplaints: number;
  pendingComplaints: number;
  activeNotices: number;
  openSosAlerts: number;
  activeEvents: number;
  propertyListings: number;
  servicesCount: number;
  lostFoundCount: number;
};

type GraphData = {
  activityData: Array<{ time: string; logins: number; complaints: number; activity: number }>;
  resolutionData: Array<{ day: string; resolved: number; pending: number }>;
};

const defaultStats: Stats = {
  totalResidents: 0,
  activeResidents: 0,
  unverifiedResidents: 0,
  totalProviders: 0,
  pendingProviders: 0,
  activeComplaints: 0,
  pendingComplaints: 0,
  activeNotices: 0,
  openSosAlerts: 0,
  activeEvents: 0,
  propertyListings: 0,
  servicesCount: 0,
  lostFoundCount: 0,
};

const defaultGraphs: GraphData = {
  activityData: [],
  resolutionData: [],
};

const isMissingGraphsEndpoint = (error: unknown) => {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  if (error.response?.status !== 404) {
    return false;
  }

  const payload = error.response?.data;
  const message = typeof payload === 'string'
    ? payload
    : typeof payload?.message === 'string'
      ? payload.message
      : '';

  return /stats\/graphs/i.test(message) || /Cannot GET/i.test(message);
};

export function Dashboard() {
  const { theme } = useTheme();
  const { role } = useRole();
  const styles = getAdminTheme(theme);
  const [stats, setStats] = useState<Stats>(defaultStats);
  const [graphs, setGraphs] = useState<GraphData>(defaultGraphs);
  const [loading, setLoading] = useState(true);
  const [graphLoading, setGraphLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [graphsError, setGraphsError] = useState<string | null>(null);

  const loadStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats({ ...defaultStats, ...(response.data || {}) });
      setStatsError(null);
    } catch (error) {
      console.error('Failed to fetch admin stats', error);
      setStatsError(getApiErrorMessage(error, 'Dashboard stats could not be loaded.'));
    } finally {
      setLoading(false);
    }
  };

  const loadGraphs = async () => {
    try {
      const response = await api.get('/admin/stats/graphs');
      setGraphs({
        activityData: Array.isArray(response.data?.activityData) ? response.data.activityData : [],
        resolutionData: Array.isArray(response.data?.resolutionData) ? response.data.resolutionData : [],
      });
      setGraphsError(null);
    } catch (error) {
      if (isMissingGraphsEndpoint(error)) {
        console.warn('Dashboard graphs endpoint is not available on the current backend. Showing dashboard stats without graph overlays.');
        setGraphs(defaultGraphs);
        setGraphsError(null);
        return;
      }

      console.error('Failed to fetch dashboard graphs', error);
      setGraphsError(getApiErrorMessage(error, 'Dashboard graph data could not be loaded.'));
    } finally {
      setGraphLoading(false);
    }
  };

  useLiveRefresh(loadStats, 15000, []);
  useLiveRefresh(loadGraphs, 20000, []);

  const statsUnavailable = Boolean(statsError) && Object.values(stats).every((value) => value === 0);
  const displayStat = (value: number) => (loading || statsUnavailable ? '--' : value);

  const summaryCards = [
    { label: 'Residents', value: stats.totalResidents, helper: `${stats.activeResidents} verified live`, icon: Users, tone: 'blue' },
    { label: 'Providers', value: stats.totalProviders, helper: `${stats.pendingProviders} pending approval`, icon: UserCog, tone: 'amber' },
    { label: 'Complaints', value: stats.activeComplaints, helper: `${stats.pendingComplaints} waiting`, icon: AlertTriangle, tone: 'red' },
    { label: 'Announcements', value: stats.activeNotices, helper: 'Live on the notice board', icon: Bell, tone: 'slate' },
    { label: 'Services', value: stats.servicesCount, helper: 'Marketplace listings', icon: ShoppingBag, tone: 'blue' },
    { label: 'Property', value: stats.propertyListings, helper: 'Active sale and rent posts', icon: Building2, tone: 'blue' },
    { label: 'Events', value: stats.activeEvents, helper: 'Upcoming community events', icon: CalendarDays, tone: 'green' },
    { label: 'SOS', value: stats.openSosAlerts, helper: 'Open or acknowledged alerts', icon: LifeBuoy, tone: 'red' },
  ] as const;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="space-y-6">
      <PageIntro
        theme={theme}
        title="UrbanEase Control Center"
        description="One place to monitor residents, providers, finance, communication, safety, and every live module connected to the mobile app."
        actions={
          <button onClick={() => { loadStats(); loadGraphs(); }} className="inline-flex items-center gap-2 rounded-2xl bg-[#57cf85] px-4 py-3 text-sm font-semibold text-white">
            <RefreshCw className="h-4 w-4" />
            Refresh Now
          </button>
        }
      />

      {statsError || graphsError ? (
        <ApiStatusBanner
          title="Admin dashboard is not connected"
          message={[statsError, graphsError].filter(Boolean).join(' ')}
        />
      ) : null}

      <div className="rounded-[32px] bg-[#57cf85] p-6 text-white shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">{getGreeting()}, {role === 'superadmin' ? 'Super Admin' : 'Admin'}</h1>
            <p className="mt-2 text-sm text-white/85">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p className="mt-3 max-w-2xl text-sm text-white/80">
              UrbanEase is now running as an all-in-one resident platform with profiles, billing, announcements, chat, services,
              carpooling, lost and found, property, events, SOS, and provider workflows connected through one admin panel.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/15 px-5 py-4 backdrop-blur">
              <p className="text-sm text-white/75">Live Verification Queue</p>
              <p className="mt-2 text-2xl font-semibold">{displayStat(stats.unverifiedResidents)}</p>
              <p className="mt-1 text-xs text-white/70">Residents waiting for approval</p>
            </div>
            <div className="rounded-2xl bg-white/15 px-5 py-4 backdrop-blur">
              <p className="text-sm text-white/75">Lost & Found Open</p>
              <p className="mt-2 text-2xl font-semibold">{displayStat(stats.lostFoundCount)}</p>
              <p className="mt-1 text-xs text-white/70">Community items still unresolved</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <AdminPanel key={card.label} theme={theme} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-sm ${styles.mutedText}`}>{card.label}</p>
                  <p className={`mt-2 text-3xl font-semibold ${styles.pageTitle}`}>{displayStat(card.value)}</p>
                  <p className={`mt-1 text-sm ${styles.mutedText}`}>{card.helper}</p>
                </div>
                <div className="rounded-2xl bg-[#57cf85]/12 p-3 text-[#57cf85]">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </AdminPanel>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
        <AdminPanel theme={theme} className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className={`text-lg font-semibold ${styles.pageTitle}`}>Platform Activity</h3>
              <p className={`mt-1 text-sm ${styles.mutedText}`}>Resident logins and complaint creation over the last 24 hours.</p>
            </div>
            <StatusBadge label={graphLoading ? 'Refreshing' : 'Live'} tone={graphLoading ? 'amber' : 'green'} />
          </div>

          {graphs.activityData.length === 0 ? (
            <div className={`flex h-[300px] items-center justify-center rounded-3xl border ${styles.panel}`}>
              <p className={`text-sm ${styles.mutedText}`}>No activity graph data is available yet.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={graphs.activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#333333' : '#E2E8F0'} />
                <XAxis dataKey="time" stroke={theme === 'dark' ? '#94A3B8' : '#64748B'} fontSize={12} />
                <YAxis stroke={theme === 'dark' ? '#94A3B8' : '#64748B'} fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#171717' : '#ffffff',
                    border: `1px solid ${theme === 'dark' ? '#333333' : '#E2E8F0'}`,
                    borderRadius: '18px',
                    color: theme === 'dark' ? '#F2F2F2' : '#0F172A',
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="logins" name="Logins" stroke="#57cf85" strokeWidth={2.5} dot={{ fill: '#57cf85', r: 4 }} />
                <Line type="monotone" dataKey="complaints" name="Complaints" stroke="#F97316" strokeWidth={2.5} dot={{ fill: '#F97316', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </AdminPanel>

        <AdminPanel theme={theme} className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className={`text-lg font-semibold ${styles.pageTitle}`}>Operational Queues</h3>
              <p className={`mt-1 text-sm ${styles.mutedText}`}>What needs admin attention right now.</p>
            </div>
            <UserCircle className="h-5 w-5 text-[#57cf85]" />
          </div>

          <div className="space-y-3">
            {[
              { label: 'Unverified residents', value: stats.unverifiedResidents, tone: stats.unverifiedResidents > 0 ? 'amber' : 'green' },
              { label: 'Pending providers', value: stats.pendingProviders, tone: stats.pendingProviders > 0 ? 'amber' : 'green' },
              { label: 'Open SOS alerts', value: stats.openSosAlerts, tone: stats.openSosAlerts > 0 ? 'red' : 'green' },
              { label: 'Pending complaints', value: stats.pendingComplaints, tone: stats.pendingComplaints > 0 ? 'amber' : 'green' },
              { label: 'Live notice posts', value: stats.activeNotices, tone: 'blue' },
              { label: 'Service listings', value: stats.servicesCount, tone: 'blue' },
            ].map((item) => (
              <div key={item.label} className={`flex items-center justify-between rounded-2xl border p-4 ${styles.panel}`}>
                <div>
                  <p className={`font-medium ${styles.pageTitle}`}>{item.label}</p>
                  <p className={`mt-1 text-sm ${styles.mutedText}`}>Connected with the mobile app backend</p>
                </div>
                <StatusBadge label={String(item.value)} tone={item.tone as any} />
              </div>
            ))}
          </div>
        </AdminPanel>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_1fr]">
        <AdminPanel theme={theme} className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className={`text-lg font-semibold ${styles.pageTitle}`}>Complaint Resolution</h3>
              <p className={`mt-1 text-sm ${styles.mutedText}`}>Weekly resolved vs pending complaint movement.</p>
            </div>
            <AlertTriangle className="h-5 w-5 text-orange-500" />
          </div>

          {graphs.resolutionData.length === 0 ? (
            <div className={`flex h-[300px] items-center justify-center rounded-3xl border ${styles.panel}`}>
              <p className={`text-sm ${styles.mutedText}`}>No resolution graph data is available yet.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={graphs.resolutionData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#333333' : '#E2E8F0'} />
                <XAxis dataKey="day" stroke={theme === 'dark' ? '#94A3B8' : '#64748B'} fontSize={12} />
                <YAxis stroke={theme === 'dark' ? '#94A3B8' : '#64748B'} fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#171717' : '#ffffff',
                    border: `1px solid ${theme === 'dark' ? '#333333' : '#E2E8F0'}`,
                    borderRadius: '18px',
                    color: theme === 'dark' ? '#F2F2F2' : '#0F172A',
                  }}
                />
                <Legend />
                <Bar dataKey="resolved" name="Resolved" fill="#57cf85" radius={[8, 8, 0, 0]} />
                <Bar dataKey="pending" name="Pending" fill="#94A3B8" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </AdminPanel>

        <AdminPanel theme={theme} className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className={`text-lg font-semibold ${styles.pageTitle}`}>System Snapshot</h3>
              <p className={`mt-1 text-sm ${styles.mutedText}`}>Finance, safety, and communication at a glance.</p>
            </div>
            <CreditCard className="h-5 w-5 text-[#57cf85]" />
          </div>

          <div className="space-y-3">
            <div className={`rounded-2xl border p-4 ${styles.panel}`}>
              <p className={`text-xs uppercase tracking-[0.15em] ${styles.mutedText}`}>Resident base</p>
              <p className={`mt-2 text-2xl font-semibold ${styles.pageTitle}`}>{displayStat(stats.totalResidents)}</p>
              <p className={`mt-1 text-sm ${styles.mutedText}`}>{displayStat(stats.activeResidents)} active, {displayStat(stats.unverifiedResidents)} waiting</p>
            </div>
            <div className={`rounded-2xl border p-4 ${styles.panel}`}>
              <p className={`text-xs uppercase tracking-[0.15em] ${styles.mutedText}`}>Safety & events</p>
              <p className={`mt-2 text-2xl font-semibold ${styles.pageTitle}`}>{displayStat(stats.openSosAlerts)} SOS • {displayStat(stats.activeEvents)} events</p>
              <p className={`mt-1 text-sm ${styles.mutedText}`}>Live incident and engagement monitoring</p>
            </div>
            <div className={`rounded-2xl border p-4 ${styles.panel}`}>
              <p className={`text-xs uppercase tracking-[0.15em] ${styles.mutedText}`}>Listings ecosystem</p>
              <p className={`mt-2 text-2xl font-semibold ${styles.pageTitle}`}>{loading || statsUnavailable ? '--' : stats.servicesCount + stats.propertyListings + stats.lostFoundCount}</p>
              <p className={`mt-1 text-sm ${styles.mutedText}`}>Services, property, and lost-and-found combined</p>
            </div>
          </div>
        </AdminPanel>
      </div>
    </div>
  );
}
