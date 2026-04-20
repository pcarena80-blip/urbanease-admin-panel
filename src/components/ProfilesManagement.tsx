import { useMemo, useState } from 'react';
import { Building2, CheckCircle2, MapPinned, MessageSquareOff, ShieldCheck, Trash2, UserCog, Users } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';
import { getApiErrorMessage } from '../utils/apiErrors';
import { AdminPanel, ApiStatusBanner, PageIntro, StatusBadge, formatDateTime, getAdminTheme, useLiveRefresh } from './AdminShared';

type ResidentRecord = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  cnic?: string;
  propertyType?: 'house' | 'apartment';
  ownership?: 'owner' | 'tenant';
  block?: string;
  street?: string;
  houseNo?: string;
  plazaName?: string;
  floorNumber?: string;
  flatNumber?: string;
  isVerified?: boolean;
  isChatBlocked?: boolean;
  registrationDate?: string;
};

type ProviderRecord = ResidentRecord & {
  role?: 'provider';
  providerStatus?: 'pending' | 'approved' | 'rejected' | 'not_applicable';
  providerProfile?: {
    businessName?: string;
    serviceCategory?: string;
    experience?: string;
    workingArea?: string;
    bankAccount?: string;
    description?: string;
    availableForNewRequests?: boolean;
  };
};

type EditState = {
  kind: 'resident' | 'provider';
  user: ResidentRecord | ProviderRecord;
};

const emptyProviderProfile = {
  businessName: '',
  serviceCategory: '',
  experience: '',
  workingArea: '',
  bankAccount: '',
  description: '',
  availableForNewRequests: true,
};

const formatAddress = (user: ResidentRecord | ProviderRecord) => {
  if (user.propertyType === 'apartment') {
    return [user.plazaName, user.floorNumber ? `Floor ${user.floorNumber}` : '', user.flatNumber ? `Flat ${user.flatNumber}` : '']
      .filter(Boolean)
      .join(', ');
  }

  return [user.block ? `Block ${user.block}` : '', user.street ? `Street ${user.street}` : '', user.houseNo ? `House ${user.houseNo}` : '']
    .filter(Boolean)
    .join(', ');
};

const getLocationGroup = (user: ResidentRecord | ProviderRecord) => {
  if (user.propertyType === 'apartment') {
    return user.plazaName || 'Apartments';
  }
  return user.block ? `Block ${user.block}` : 'Unassigned';
};

export function ProfilesManagement({ searchQuery = '' }: { searchQuery?: string }) {
  const { theme } = useTheme();
  const styles = getAdminTheme(theme);
  const [activeTab, setActiveTab] = useState<'residents' | 'providers' | 'directory'>('residents');
  const [residents, setResidents] = useState<ResidentRecord[]>([]);
  const [providers, setProviders] = useState<ProviderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [formState, setFormState] = useState<any>(null);

  const loadProfiles = async () => {
    try {
      const [residentRes, providerRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/providers'),
      ]);
      setResidents(Array.isArray(residentRes.data) ? residentRes.data : []);
      setProviders(Array.isArray(providerRes.data) ? providerRes.data : []);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch profile management data', error);
      setError(getApiErrorMessage(error, 'Profiles could not be loaded.'));
    } finally {
      setLoading(false);
    }
  };

  useLiveRefresh(loadProfiles, 15000, []);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredResidents = useMemo(
    () =>
      residents.filter((resident) => {
        if (!normalizedQuery) return true;
        return [
          resident.name,
          resident.email,
          resident.phone,
          resident.cnic,
          formatAddress(resident),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);
      }),
    [normalizedQuery, residents],
  );

  const filteredProviders = useMemo(
    () =>
      providers.filter((provider) => {
        if (!normalizedQuery) return true;
        return [
          provider.name,
          provider.email,
          provider.phone,
          provider.providerProfile?.businessName,
          provider.providerProfile?.serviceCategory,
          provider.providerProfile?.workingArea,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);
      }),
    [normalizedQuery, providers],
  );

  const directoryGroups = useMemo(() => {
    const combined = [...filteredResidents, ...filteredProviders];
    const groups = combined.reduce<Record<string, Array<ResidentRecord | ProviderRecord>>>((acc, user) => {
      const key = getLocationGroup(user);
      if (!acc[key]) acc[key] = [];
      acc[key].push(user);
      return acc;
    }, {});
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredProviders, filteredResidents]);

  const openEditor = (kind: 'resident' | 'provider', user: ResidentRecord | ProviderRecord) => {
    setEditState({ kind, user });
    setFormState({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      cnic: user.cnic || '',
      propertyType: user.propertyType || 'house',
      ownership: user.ownership || 'owner',
      block: user.block || '',
      street: user.street || '',
      houseNo: user.houseNo || '',
      plazaName: user.plazaName || '',
      floorNumber: user.floorNumber || '',
      flatNumber: user.flatNumber || '',
      providerStatus: (user as ProviderRecord).providerStatus || 'pending',
      providerProfile: {
        ...emptyProviderProfile,
        ...(user as ProviderRecord).providerProfile,
      },
    });
  };

  const handleSaveProfile = async () => {
    if (!editState || !formState) return;
    setSaving(true);
    try {
      const payload = {
        ...formState,
        providerProfile: editState.kind === 'provider' ? formState.providerProfile : undefined,
      };
      const response = await api.put(`/admin/users/${editState.user._id}/profile`, payload);

      if (editState.kind === 'provider') {
        setProviders((prev) => prev.map((item) => (item._id === editState.user._id ? response.data : item)));
      } else {
        setResidents((prev) => prev.map((item) => (item._id === editState.user._id ? response.data : item)));
      }

      setEditState(null);
      setFormState(null);
    } catch (error: any) {
      alert(error?.response?.data?.message || 'The profile could not be updated.');
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyToggle = async (user: ResidentRecord) => {
    try {
      await api.put(`/admin/users/${user._id}/verify`, { isVerified: !user.isVerified });
      setResidents((prev) => prev.map((item) => (item._id === user._id ? { ...item, isVerified: !item.isVerified } : item)));
    } catch (error: any) {
      alert(error?.response?.data?.message || 'The verification status could not be updated.');
    }
  };

  const handleChatBlockToggle = async (user: ResidentRecord) => {
    try {
      await api.put(`/admin/users/${user._id}/chat-block`, { block: !user.isChatBlocked });
      setResidents((prev) => prev.map((item) => (item._id === user._id ? { ...item, isChatBlocked: !item.isChatBlocked } : item)));
    } catch (error: any) {
      alert(error?.response?.data?.message || 'The chat block state could not be updated.');
    }
  };

  const handleProviderStatus = async (provider: ProviderRecord, status: ProviderRecord['providerStatus']) => {
    try {
      await api.put(`/admin/providers/${provider._id}/status`, { status });
      setProviders((prev) => prev.map((item) => (item._id === provider._id ? { ...item, providerStatus: status } : item)));
    } catch (error: any) {
      alert(error?.response?.data?.message || 'The provider status could not be updated.');
    }
  };

  const handleDelete = async (kind: 'resident' | 'provider', user: ResidentRecord | ProviderRecord) => {
    const confirmed = window.confirm(`Delete ${user.name}? This removes linked data and cannot be undone.`);
    if (!confirmed) return;

    try {
      if (kind === 'provider') {
        await api.delete(`/admin/providers/${user._id}`);
        setProviders((prev) => prev.filter((item) => item._id !== user._id));
      } else {
        await api.delete(`/admin/users/${user._id}`);
        setResidents((prev) => prev.filter((item) => item._id !== user._id));
      }
    } catch (error: any) {
      alert(error?.response?.data?.message || 'The record could not be removed.');
    }
  };

  const stats = [
    { label: 'Residents', value: residents.length, icon: Users, tone: 'blue' as const },
    { label: 'Verified', value: residents.filter((item) => item.isVerified).length, icon: ShieldCheck, tone: 'green' as const },
    { label: 'Providers', value: providers.length, icon: UserCog, tone: 'amber' as const },
    { label: 'Locations', value: directoryGroups.length, icon: MapPinned, tone: 'slate' as const },
  ];

  return (
    <div className="space-y-6">
      <PageIntro
        theme={theme}
        title="Profiles & Directory"
        description="Manage resident profiles, service-provider accounts, verification state, and the UrbanEase directory map."
      />

      {error ? (
        <ApiStatusBanner
          title="Profiles are offline"
          message={error}
        />
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <AdminPanel key={item.label} theme={theme} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-sm ${styles.mutedText}`}>{item.label}</p>
                  <p className={`mt-2 text-3xl font-semibold ${styles.pageTitle}`}>{item.value}</p>
                </div>
                <div className="rounded-2xl bg-[#57cf85]/12 p-3 text-[#57cf85]">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </AdminPanel>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3">
        {[
          ['residents', 'Residents'],
          ['providers', 'Providers'],
          ['directory', 'Directory Map'],
        ].map(([value, label]) => (
          <button
            key={value}
            onClick={() => setActiveTab(value as 'residents' | 'providers' | 'directory')}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${activeTab === value ? 'bg-[#57cf85] text-white' : theme === 'dark' ? 'bg-[#1F1F1F] text-slate-300' : 'bg-white text-slate-600 border border-slate-200'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'residents' ? (
        <AdminPanel theme={theme} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className={`${styles.tableHeader} border-b`}>
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em]">Resident</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em]">Profile</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em]">Address</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em]">Status</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-500">Loading residents...</td>
                  </tr>
                ) : filteredResidents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-500">No resident profiles match the current search.</td>
                  </tr>
                ) : (
                  filteredResidents.map((resident) => (
                    <tr key={resident._id} className={`${styles.tableRow} border-b align-top`}>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{resident.name}</div>
                        <div className={`mt-1 text-sm ${styles.mutedText}`}>{resident.email}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className={`text-sm ${styles.pageTitle}`}>{resident.phone || 'No phone'}</div>
                        <div className={`mt-1 text-sm ${styles.mutedText}`}>{resident.cnic || 'CNIC missing'}</div>
                        <div className={`mt-1 text-xs ${styles.mutedText}`}>Created {formatDateTime(resident.registrationDate)}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className={`text-sm ${styles.pageTitle}`}>{formatAddress(resident) || 'Address not added'}</div>
                        <div className={`mt-1 text-xs ${styles.mutedText}`}>{resident.propertyType || 'house'} • {resident.ownership || 'owner'}</div>
                      </td>
                      <td className="px-5 py-4 space-y-2">
                        <div>{resident.isVerified ? <StatusBadge label="Verified" tone="green" /> : <StatusBadge label="Pending Verification" tone="amber" />}</div>
                        <div>{resident.isChatBlocked ? <StatusBadge label="Chat Blocked" tone="red" /> : <StatusBadge label="Chat Active" tone="blue" />}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => openEditor('resident', resident)} className="rounded-xl bg-[#57cf85]/12 px-3 py-2 text-sm font-medium text-[#57cf85]">Edit</button>
                          <button onClick={() => handleVerifyToggle(resident)} className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
                            {resident.isVerified ? 'Unverify' : 'Verify'}
                          </button>
                          <button onClick={() => handleChatBlockToggle(resident)} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">
                            {resident.isChatBlocked ? 'Unblock Chat' : 'Block Chat'}
                          </button>
                          <button onClick={() => handleDelete('resident', resident)} className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </AdminPanel>
      ) : null}

      {activeTab === 'providers' ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {loading ? (
            <AdminPanel theme={theme} className="p-6">
              <p className={`text-sm ${styles.mutedText}`}>Loading providers...</p>
            </AdminPanel>
          ) : filteredProviders.length === 0 ? (
            <AdminPanel theme={theme} className="p-6">
              <p className={`text-sm ${styles.mutedText}`}>No providers match the current search.</p>
            </AdminPanel>
          ) : (
            filteredProviders.map((provider) => (
              <AdminPanel key={provider._id} theme={theme} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className={`text-lg font-semibold ${styles.pageTitle}`}>{provider.providerProfile?.businessName || provider.name}</h3>
                    <p className={`mt-1 text-sm ${styles.mutedText}`}>{provider.email} • {provider.phone || 'No phone'}</p>
                    <p className={`mt-1 text-sm ${styles.mutedText}`}>{provider.providerProfile?.serviceCategory || 'Category not added'}</p>
                  </div>
                  <StatusBadge
                    label={provider.providerStatus === 'approved' ? 'Approved' : provider.providerStatus === 'rejected' ? 'Rejected' : 'Pending'}
                    tone={provider.providerStatus === 'approved' ? 'green' : provider.providerStatus === 'rejected' ? 'red' : 'amber'}
                  />
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className={`rounded-2xl border p-3 ${styles.panel}`}>
                    <p className={`text-xs uppercase tracking-[0.15em] ${styles.mutedText}`}>Working Area</p>
                    <p className={`mt-2 text-sm ${styles.pageTitle}`}>{provider.providerProfile?.workingArea || 'Not shared yet'}</p>
                  </div>
                  <div className={`rounded-2xl border p-3 ${styles.panel}`}>
                    <p className={`text-xs uppercase tracking-[0.15em] ${styles.mutedText}`}>Experience</p>
                    <p className={`mt-2 text-sm ${styles.pageTitle}`}>{provider.providerProfile?.experience || 'Not shared yet'}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => openEditor('provider', provider)} className="rounded-xl bg-[#57cf85]/12 px-3 py-2 text-sm font-medium text-[#57cf85]">Edit Profile</button>
                  <button onClick={() => handleProviderStatus(provider, 'approved')} className="rounded-xl bg-[#57cf85]/12 px-3 py-2 text-sm font-medium text-[#57cf85]">Approve</button>
                  <button onClick={() => handleProviderStatus(provider, 'pending')} className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">Mark Pending</button>
                  <button onClick={() => handleProviderStatus(provider, 'rejected')} className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">Reject</button>
                  <button onClick={() => handleDelete('provider', provider)} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">Remove</button>
                </div>
              </AdminPanel>
            ))
          )}
        </div>
      ) : null}

      {activeTab === 'directory' ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {directoryGroups.map(([location, entries]) => (
            <AdminPanel key={location} theme={theme} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className={`text-lg font-semibold ${styles.pageTitle}`}>{location}</h3>
                  <p className={`mt-1 text-sm ${styles.mutedText}`}>{entries.length} linked profiles in this location group</p>
                </div>
                <MapPinned className="h-5 w-5 text-[#57cf85]" />
              </div>

              <div className="mt-4 space-y-3">
                {entries.slice(0, 6).map((entry) => (
                  <div key={entry._id} className={`rounded-2xl border p-3 ${styles.panel}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className={`font-medium ${styles.pageTitle}`}>{entry.name}</p>
                        <p className={`mt-1 text-sm ${styles.mutedText}`}>{formatAddress(entry) || 'Address missing'}</p>
                      </div>
                      <StatusBadge label={(entry as ProviderRecord).providerStatus ? 'Provider' : 'Resident'} tone={(entry as ProviderRecord).providerStatus ? 'blue' : 'slate'} />
                    </div>
                  </div>
                ))}
              </div>
            </AdminPanel>
          ))}
        </div>
      ) : null}

      {editState && formState ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className={`w-full max-w-3xl rounded-[28px] border p-6 shadow-2xl ${styles.card}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className={`text-xl font-semibold ${styles.pageTitle}`}>
                  {editState.kind === 'provider' ? 'Edit Provider Profile' : 'Edit Resident Profile'}
                </h3>
                <p className={`mt-1 text-sm ${styles.mutedText}`}>Update the connected app profile and save it back to the live backend.</p>
              </div>
              <button onClick={() => { setEditState(null); setFormState(null); }} className="rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">Close</button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {[
                ['name', 'Full name'],
                ['email', 'Email'],
                ['phone', 'Phone'],
                ['cnic', 'CNIC'],
                ['propertyType', 'Property type'],
                ['ownership', 'Ownership'],
                ['block', 'Block'],
                ['street', 'Street'],
                ['houseNo', 'House No'],
                ['plazaName', 'Plaza Name'],
                ['floorNumber', 'Floor Number'],
                ['flatNumber', 'Flat Number'],
              ].map(([field, label]) => (
                <div key={field}>
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.15em] ${styles.mutedText}`}>{label}</label>
                  <input
                    value={formState[field] || ''}
                    onChange={(event) => setFormState((prev: any) => ({ ...prev, [field]: event.target.value }))}
                    className={`w-full rounded-2xl border px-4 py-3 text-sm ${styles.input}`}
                  />
                </div>
              ))}

              {editState.kind === 'provider' ? (
                <>
                  {[
                    ['businessName', 'Business Name'],
                    ['serviceCategory', 'Service Category'],
                    ['experience', 'Experience'],
                    ['workingArea', 'Working Area'],
                    ['bankAccount', 'Bank Account'],
                  ].map(([field, label]) => (
                    <div key={field}>
                      <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.15em] ${styles.mutedText}`}>{label}</label>
                      <input
                        value={formState.providerProfile?.[field] || ''}
                        onChange={(event) =>
                          setFormState((prev: any) => ({
                            ...prev,
                            providerProfile: {
                              ...prev.providerProfile,
                              [field]: event.target.value,
                            },
                          }))
                        }
                        className={`w-full rounded-2xl border px-4 py-3 text-sm ${styles.input}`}
                      />
                    </div>
                  ))}
                  <div className="md:col-span-2">
                    <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.15em] ${styles.mutedText}`}>Provider Description</label>
                    <textarea
                      value={formState.providerProfile?.description || ''}
                      onChange={(event) =>
                        setFormState((prev: any) => ({
                          ...prev,
                          providerProfile: {
                            ...prev.providerProfile,
                            description: event.target.value,
                          },
                        }))
                      }
                      className={`min-h-[120px] w-full rounded-2xl border px-4 py-3 text-sm ${styles.input}`}
                    />
                  </div>
                </>
              ) : null}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => { setEditState(null); setFormState(null); }} className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">Cancel</button>
              <button onClick={handleSaveProfile} disabled={saving} className="rounded-2xl bg-[#57cf85] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
