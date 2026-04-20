import { useMemo, useState } from 'react';
import { Filter, CheckCircle, Clock, AlertCircle, Eye, XCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';
import { getApiErrorMessage } from '../utils/apiErrors';
import { ApiStatusBanner, useLiveRefresh } from './AdminShared';
import { resolveMediaUrl } from '../utils/media';

interface Complaint {
  id: string;
  userId?: {
    name?: string;
    email?: string;
    houseNo?: string;
    block?: string;
  };
  subject: string;
  category: string;
  description: string;
  priority?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  response?: string;
  image?: string;
}

const filterOrder = ['all', 'active', 'pending', 'in-progress', 'history'] as const;

export function Complaints({ searchQuery = '' }: { searchQuery?: string }) {
  const { theme } = useTheme();
  const [filter, setFilter] = useState<(typeof filterOrder)[number]>('all');
  const [selectedComplaint, setSelectedComplaint] = useState<string | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComplaints = async () => {
    try {
      if (complaints.length === 0) {
        setLoading(true);
      }

      const response = await api.get('/admin/complaints');
      setComplaints(Array.isArray(response.data) ? response.data : []);
      setError(null);
    } catch (requestError) {
      console.error('Failed to fetch complaints', requestError);
      setError(getApiErrorMessage(requestError, 'Complaints could not be loaded right now.'));
    } finally {
      setLoading(false);
    }
  };

  useLiveRefresh(fetchComplaints, 15000, [complaints.length]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const response = await api.put(`/admin/complaints/${id}/status`, { status: newStatus });
      const nextComplaint = response.data as Complaint;

      setComplaints((currentComplaints) =>
        currentComplaints.map((complaint) => (complaint.id === id ? nextComplaint : complaint)),
      );
    } catch (requestError) {
      console.error('Failed to update status', requestError);
      alert('Failed to update status');
    }
  };

  const filteredComplaints = useMemo(() => {
    return complaints
      .filter((complaint) => {
        if (filter === 'all') return true;
        if (filter === 'active') return ['pending', 'in-progress'].includes(complaint.status);
        if (filter === 'history') return ['resolved', 'rejected'].includes(complaint.status);
        return complaint.status === filter;
      })
      .filter((complaint) => {
        if (!searchQuery) return true;

        const normalizedQuery = searchQuery.toLowerCase();
        return [
          complaint.subject,
          complaint.category,
          complaint.description,
          complaint.userId?.name,
          complaint.userId?.email,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);
      });
  }, [complaints, filter, searchQuery]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-3 py-1 text-sm text-yellow-600">
            <AlertCircle className="h-4 w-4" />
            Pending
          </span>
        );
      case 'in-progress':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#57cf85]/20 bg-[#57cf85]/12 px-3 py-1 text-sm text-[#57cf85]">
            <Clock className="h-4 w-4" />
            In Progress
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#57cf85]/20 bg-[#57cf85]/12 px-3 py-1 text-sm text-[#57cf85]">
            <CheckCircle className="h-4 w-4" />
            Resolved
          </span>
        );
      case 'rejected':
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm ${
              theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
            }`}
          >
            <XCircle className="h-4 w-4" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl ${theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>Complaints Management</h2>
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Track and resolve resident complaints</p>
        </div>
        <div className="flex items-center gap-3">
          <Filter className={`h-5 w-5 ${theme === 'dark' ? 'text-white opacity-70' : 'text-gray-600'}`} />
          <div className="flex gap-2">
            {filterOrder.map((filterValue) => (
              <button
                key={filterValue}
                onClick={() => setFilter(filterValue)}
                className={`rounded-lg px-4 py-2 capitalize transition-colors ${
                  filter === filterValue
                    ? filterValue === 'history'
                      ? 'bg-[#57cf85] text-white'
                      : 'bg-[#57cf85] text-white'
                    : theme === 'dark'
                      ? 'bg-[#2A2A2A] text-gray-300 hover:bg-[#333333]'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filterValue === 'history' ? 'History' : filterValue.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {error ? (
          <ApiStatusBanner
            title="Complaints are offline"
            message={error}
          />
        ) : null}

        {loading ? <p className="text-center">Loading complaints...</p> : null}

        {!loading
          ? filteredComplaints.map((complaint) => (
              <div
                key={complaint.id}
                className={`rounded-xl border p-6 shadow-sm ${
                  theme === 'dark' ? 'border-[#333333] bg-[#1F1F1F]' : 'border-gray-100 bg-white'
                }`}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#57cf85] text-white">
                        {complaint.userId?.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className={theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}>
                          {complaint.userId?.name || 'Resident'}
                        </p>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {formatDate(complaint.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="mb-2">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-sm ${
                          theme === 'dark' ? 'bg-[#2A2A2A] text-gray-300' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {complaint.category}
                      </span>
                    </div>
                    <h4 className={`font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>
                      {complaint.subject}
                    </h4>
                    <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{complaint.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(complaint.status)}
                    <button
                      onClick={() => setSelectedComplaint(selectedComplaint === complaint.id ? null : complaint.id)}
                      className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-colors ${
                        theme === 'dark'
                          ? 'bg-[#2A2A2A] text-gray-300 hover:bg-[#333333]'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Eye className="h-4 w-4" />
                      {selectedComplaint === complaint.id ? 'Hide Details' : 'View Details'}
                    </button>
                  </div>
                </div>

                {selectedComplaint === complaint.id ? (
                  <div className={`mt-4 border-t pt-4 ${theme === 'dark' ? 'border-[#333333]' : 'border-gray-200'}`}>
                    <h4 className={`mb-3 ${theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>History</h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-2 h-2 w-2 rounded-full bg-[#57cf85]" />
                        <div>
                          <p className={theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}>Submitted</p>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            {formatDate(complaint.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {complaint.image ? (
                      <div className="mt-4">
                        <h5 className={`mb-2 text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          Attachment
                        </h5>
                        <div className="inline-block overflow-hidden rounded-lg border border-gray-200">
                          <img
                            src={resolveMediaUrl(complaint.image)}
                            alt="Complaint attachment"
                            className="h-auto max-h-64 max-w-full object-contain"
                            onError={(event) => {
                              (event.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      </div>
                    ) : null}

                    <div className={`mt-4 border-t pt-4 ${theme === 'dark' ? 'border-[#333333]' : 'border-gray-200'}`}>
                      <p className={`mb-3 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Change Status:</p>
                      {complaint.status === 'resolved' || complaint.status === 'rejected' ? (
                        <p className={`text-sm italic ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                          Status is locked. This complaint has been {complaint.status} and cannot be modified.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleUpdateStatus(complaint.id, 'pending')}
                            disabled={complaint.status === 'pending'}
                            className={`rounded-lg px-4 py-2 text-sm transition-colors ${
                              complaint.status === 'pending' ? 'cursor-not-allowed opacity-50' : ''
                            } ${
                              theme === 'dark'
                                ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                                : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            }`}
                          >
                            Mark Pending
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(complaint.id, 'in-progress')}
                            disabled={complaint.status === 'in-progress'}
                            className={`rounded-lg px-4 py-2 text-sm transition-colors ${
                              complaint.status === 'in-progress' ? 'cursor-not-allowed opacity-50' : ''
                            } ${
                              theme === 'dark'
                      ? 'bg-[#57cf85]/20 text-[#57cf85] hover:bg-[#57cf85]/30'
                      : 'bg-[#57cf85]/12 text-[#57cf85] hover:bg-[#57cf85]/20'
                            }`}
                          >
                            In Progress
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(complaint.id, 'resolved')}
                            className={`rounded-lg px-4 py-2 text-sm transition-colors ${
                              theme === 'dark'
                                ? 'bg-[#57cf85]/20 text-[#57cf85] hover:bg-[#57cf85]/30'
                                : 'bg-[#57cf85]/12 text-[#57cf85] hover:bg-[#57cf85]/20'
                            }`}
                          >
                            Resolve
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(complaint.id, 'rejected')}
                            className={`rounded-lg px-4 py-2 text-sm transition-colors ${
                              theme === 'dark'
                                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            ))
          : null}

        {!loading && error ? <p className="text-center text-gray-500">{error}</p> : null}
        {!loading && !error && filteredComplaints.length === 0 ? (
          <p className="text-center text-gray-500">
            {complaints.length === 0 ? 'No complaints have been submitted yet.' : 'No complaints match the selected filter.'}
          </p>
        ) : null}
      </div>
    </div>
  );
}
