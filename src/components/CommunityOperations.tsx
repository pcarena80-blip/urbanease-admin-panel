import { useEffect, useMemo, useState } from 'react';
import { AlertOctagon, CalendarDays, Home, LifeBuoy, PackageSearch, ShieldAlert, ShoppingBag, Trash2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';
import { getApiErrorMessage } from '../utils/apiErrors';
import { AdminPanel, ApiStatusBanner, PageIntro, StatusBadge, formatDateTime, getAdminTheme, useLiveRefresh } from './AdminShared';
import { resolveMediaUrl } from '../utils/media';

type ServiceListing = {
  _id: string;
  title: string;
  category: string;
  phone: string;
  location?: string;
  description: string;
  isAvailable: boolean;
  providerType?: string;
  createdAt?: string;
  owner?: {
    name?: string;
    email?: string;
    phone?: string;
    providerProfile?: {
      businessName?: string;
    };
  };
};

type LostFoundItem = {
  _id: string;
  type: 'lost' | 'found';
  itemName: string;
  description: string;
  location: string;
  contactPhone: string;
  image?: string;
  status: 'open' | 'claimed';
  createdAt?: string;
  owner?: {
    name?: string;
    email?: string;
  };
};

type EventRecord = {
  _id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  capacity?: number;
  attendeesBaseline?: number;
  currentAttendees?: number;
  category?: string;
  description: string;
  status: 'upcoming' | 'completed' | 'cancelled';
};

type PropertyRecord = {
  _id: string;
  ownerName: string;
  listingType: 'sale' | 'rent';
  unit: string;
  propertyType: string;
  price: string;
  area?: string;
  bedrooms?: string;
  bathrooms?: string;
  description: string;
  phone: string;
  status: 'active' | 'pending' | 'closed' | 'rejected';
  createdAt?: string;
};

type EmergencyContact = {
  _id?: string;
  title: string;
  number: string;
  group?: string;
  description?: string;
  order?: number;
};

type SosAlert = {
  _id: string;
  userName: string;
  contactTitle: string;
  contactNumber: string;
  notes?: string;
  status: 'open' | 'acknowledged' | 'resolved' | 'cancelled';
  createdAt?: string;
};

type CommunitySummary = {
  servicesCount: number;
  lostFoundCount: number;
  activeEvents: number;
  propertyListings: number;
  openSosAlerts: number;
  sosContactsCount: number;
};

const emptyEvent = {
  title: '',
  date: '',
  time: '',
  location: '',
  capacity: 0,
  attendeesBaseline: 0,
  category: 'Community',
  description: '',
  status: 'upcoming',
};

const emptyContact = {
  title: '',
  number: '',
  group: 'emergency',
  description: '',
  order: 0,
};

const PROPERTY_PAGE_SIZE = 24;
const defaultSummary: CommunitySummary = {
  servicesCount: 0,
  lostFoundCount: 0,
  activeEvents: 0,
  propertyListings: 0,
  openSosAlerts: 0,
  sosContactsCount: 0,
};

export function CommunityOperations({ searchQuery = '' }: { searchQuery?: string }) {
  const { theme } = useTheme();
  const styles = getAdminTheme(theme);
  const [activeTab, setActiveTab] = useState<'services' | 'lostfound' | 'events' | 'property' | 'sos'>('services');
  const [summary, setSummary] = useState<CommunitySummary>(defaultSummary);
  const [services, setServices] = useState<ServiceListing[]>([]);
  const [lostFound, setLostFound] = useState<LostFoundItem[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [alerts, setAlerts] = useState<SosAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [tabError, setTabError] = useState<string | null>(null);
  const [loadedTabs, setLoadedTabs] = useState({
    services: false,
    lostfound: false,
    events: false,
    property: false,
    sos: false,
  });
  const [propertyPage, setPropertyPage] = useState(1);
  const [propertyMeta, setPropertyMeta] = useState({
    page: 1,
    total: 0,
    limit: PROPERTY_PAGE_SIZE,
    hasMore: false,
  });
  const [saving, setSaving] = useState(false);
  const [eventForm, setEventForm] = useState<any>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState<any>(null);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);

  const propertySearchKey = activeTab === 'property' ? searchQuery.trim() : '';

  const loadSummary = async () => {
    try {
      const response = await api.get('/admin/stats');
      setSummary({
        servicesCount: Number(response.data?.servicesCount || 0),
        lostFoundCount: Number(response.data?.lostFoundCount || 0),
        activeEvents: Number(response.data?.activeEvents || 0),
        propertyListings: Number(response.data?.propertyListings || 0),
        openSosAlerts: Number(response.data?.openSosAlerts || 0),
        sosContactsCount: Number(response.data?.sosContactsCount || 0),
      });
      setSummaryError(null);
    } catch (summaryError) {
      console.error('Failed to load community summary', summaryError);
      setSummaryError(getApiErrorMessage(summaryError, 'Community summary could not be loaded.'));
    }
  };

  const loadActiveTab = async (tab = activeTab, background = false) => {
    const shouldShowLoading = !background && !loadedTabs[tab];

    if (shouldShowLoading) {
      setLoading(true);
    }

    try {
      if (tab === 'services') {
        const servicesRes = await api.get('/admin/services');
        setServices(Array.isArray(servicesRes.data) ? servicesRes.data : []);
      } else if (tab === 'lostfound') {
        const lostFoundRes = await api.get('/admin/lost-found');
        setLostFound(Array.isArray(lostFoundRes.data) ? lostFoundRes.data : []);
      } else if (tab === 'events') {
        const eventsRes = await api.get('/admin/events');
        setEvents(Array.isArray(eventsRes.data) ? eventsRes.data : []);
      } else if (tab === 'property') {
        const propertiesRes = await api.get('/admin/properties', {
          params: {
            page: propertyPage,
            limit: PROPERTY_PAGE_SIZE,
            search: propertySearchKey,
          },
        });

        setProperties(Array.isArray(propertiesRes.data?.items) ? propertiesRes.data.items : []);
        setPropertyMeta({
          page: Number(propertiesRes.data?.page || 1),
          total: Number(propertiesRes.data?.total || 0),
          limit: Number(propertiesRes.data?.limit || PROPERTY_PAGE_SIZE),
          hasMore: Boolean(propertiesRes.data?.hasMore),
        });
      } else {
        const [contactsRes, alertsRes] = await Promise.all([
          api.get('/admin/sos/contacts'),
          api.get('/admin/sos/alerts'),
        ]);

        setContacts(Array.isArray(contactsRes.data) ? contactsRes.data : []);
        setAlerts(Array.isArray(alertsRes.data) ? alertsRes.data : []);
      }

      setLoadedTabs((currentLoadedTabs) => ({
        ...currentLoadedTabs,
        [tab]: true,
      }));
      setTabError(null);
    } catch (requestError) {
      console.error(`Failed to load ${tab} data`, requestError);
      setTabError(getApiErrorMessage(requestError, `${tab} data could not be loaded.`));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  useEffect(() => {
    if (activeTab === 'property') {
      setPropertyPage(1);
    }
  }, [activeTab, propertySearchKey]);

  useEffect(() => {
    loadActiveTab(activeTab);
  }, [activeTab, propertyPage, propertySearchKey]);

  useLiveRefresh(async () => {
    await Promise.allSettled([loadSummary(), loadActiveTab(activeTab, true)]);
  }, 15000, [activeTab, propertyPage, propertySearchKey]);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const matches = (...values: Array<string | undefined>) =>
    !normalizedQuery || values.filter(Boolean).join(' ').toLowerCase().includes(normalizedQuery);

  const filteredServices = useMemo(
    () => services.filter((item) => matches(item.title, item.category, item.description, item.location, item.owner?.name, item.owner?.providerProfile?.businessName)),
    [normalizedQuery, services],
  );
  const filteredLostFound = useMemo(
    () => lostFound.filter((item) => matches(item.itemName, item.description, item.location, item.owner?.name, item.type)),
    [lostFound, normalizedQuery],
  );
  const filteredEvents = useMemo(
    () => events.filter((item) => matches(item.title, item.location, item.description, item.category, item.status)),
    [events, normalizedQuery],
  );
  const filteredProperties = useMemo(
    () => (activeTab === 'property' ? properties : properties.filter((item) => matches(item.ownerName, item.unit, item.propertyType, item.listingType, item.status, item.price))),
    [activeTab, normalizedQuery, properties],
  );
  const filteredContacts = useMemo(
    () => contacts.filter((item) => matches(item.title, item.group, item.number, item.description)),
    [contacts, normalizedQuery],
  );
  const filteredAlerts = useMemo(
    () => alerts.filter((item) => matches(item.userName, item.contactTitle, item.notes, item.status)),
    [alerts, normalizedQuery],
  );

  const stats = [
    { label: 'Services', value: summary.servicesCount, icon: ShoppingBag },
    { label: 'Lost & Found', value: summary.lostFoundCount, icon: PackageSearch },
    { label: 'Events', value: summary.activeEvents, icon: CalendarDays },
    { label: 'Properties', value: summary.propertyListings, icon: Home },
    { label: 'Open SOS', value: summary.openSosAlerts, icon: ShieldAlert },
  ];

  const updateServiceAvailability = async (listing: ServiceListing) => {
    try {
      const response = await api.put(`/admin/services/${listing._id}/availability`, { isAvailable: !listing.isAvailable });
      setServices((prev) => prev.map((item) => (item._id === listing._id ? response.data : item)));
    } catch (error: any) {
      alert(error?.response?.data?.message || 'The service availability could not be updated.');
    }
  };

  const deleteRecord = async (kind: 'services' | 'lost-found' | 'events' | 'properties' | 'sos-contact', id: string) => {
    const confirmed = window.confirm('Delete this record from the live backend?');
    if (!confirmed) return;

    try {
      if (kind === 'services') {
        await api.delete(`/admin/services/${id}`);
        setServices((prev) => prev.filter((item) => item._id !== id));
      } else if (kind === 'lost-found') {
        await api.delete(`/admin/lost-found/${id}`);
        setLostFound((prev) => prev.filter((item) => item._id !== id));
      } else if (kind === 'events') {
        await api.delete(`/admin/events/${id}`);
        setEvents((prev) => prev.filter((item) => item._id !== id));
      } else if (kind === 'properties') {
        await api.delete(`/admin/properties/${id}`);
        setProperties((prev) => prev.filter((item) => item._id !== id));
      } else {
        await api.delete(`/admin/sos/contacts/${id}`);
        setContacts((prev) => prev.filter((item) => item._id !== id));
      }
    } catch (error: any) {
      alert(error?.response?.data?.message || 'The record could not be deleted.');
    }
  };

  const updateLostFoundStatus = async (item: LostFoundItem, status: LostFoundItem['status']) => {
    try {
      const response = await api.put(`/admin/lost-found/${item._id}/status`, { status });
      setLostFound((prev) => prev.map((entry) => (entry._id === item._id ? response.data : entry)));
    } catch (error: any) {
      alert(error?.response?.data?.message || 'The item status could not be updated.');
    }
  };

  const updatePropertyStatus = async (item: PropertyRecord, status: PropertyRecord['status']) => {
    try {
      const response = await api.put(`/admin/properties/${item._id}/status`, { status });
      setProperties((prev) => prev.map((entry) => (entry._id === item._id ? response.data : entry)));
    } catch (error: any) {
      alert(error?.response?.data?.message || 'The property status could not be updated.');
    }
  };

  const updateAlertStatus = async (item: SosAlert, status: SosAlert['status']) => {
    try {
      const response = await api.put(`/admin/sos/alerts/${item._id}/status`, { status });
      setAlerts((prev) => prev.map((entry) => (entry._id === item._id ? response.data : entry)));
    } catch (error: any) {
      alert(error?.response?.data?.message || 'The SOS alert status could not be updated.');
    }
  };

  const startCreateEvent = () => {
    setEditingEventId(null);
    setEventForm({ ...emptyEvent });
  };

  const startEditEvent = (item: EventRecord) => {
    setEditingEventId(item._id);
    setEventForm({
      title: item.title,
      date: item.date,
      time: item.time,
      location: item.location,
      capacity: item.capacity || 0,
      attendeesBaseline: item.attendeesBaseline || 0,
      category: item.category || 'Community',
      description: item.description,
      status: item.status,
    });
  };

  const saveEvent = async () => {
    if (!eventForm) return;
    setSaving(true);
    try {
      const response = editingEventId
        ? await api.put(`/admin/events/${editingEventId}`, eventForm)
        : await api.post('/admin/events', eventForm);

      if (editingEventId) {
        setEvents((prev) => prev.map((item) => (item._id === editingEventId ? response.data : item)));
      } else {
        setEvents((prev) => [response.data, ...prev]);
      }

      setEventForm(null);
      setEditingEventId(null);
    } catch (error: any) {
      alert(error?.response?.data?.message || 'The event could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const startCreateContact = () => {
    setEditingContactId(null);
    setContactForm({ ...emptyContact });
  };

  const startEditContact = (contact: EmergencyContact) => {
    setEditingContactId(contact._id || null);
      setContactForm({
        title: contact.title,
        number: contact.number,
        group: contact.group || 'emergency',
        description: contact.description || '',
        order: contact.order || 0,
      });
  };

  const saveContact = async () => {
    if (!contactForm) return;
    setSaving(true);
    try {
      const response = editingContactId
        ? await api.put(`/admin/sos/contacts/${editingContactId}`, contactForm)
        : await api.post('/admin/sos/contacts', contactForm);

      if (editingContactId) {
        setContacts((prev) => prev.map((item) => (item._id === editingContactId ? response.data : item)));
      } else {
        setContacts((prev) => [...prev, response.data].sort((a, b) => (a.order || 0) - (b.order || 0)));
      }

      setEditingContactId(null);
      setContactForm(null);
    } catch (error: any) {
      alert(error?.response?.data?.message || 'The SOS contact could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageIntro
        theme={theme}
        title="Community Ops"
        description="Run services, events, listings, lost-and-found, and SOS operations from one live admin workspace."
      />

      {summaryError || tabError ? (
        <ApiStatusBanner
          title="Community operations are offline"
          message={[summaryError, tabError].filter(Boolean).join(' ')}
        />
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
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
          ['services', 'Services'],
          ['lostfound', 'Lost & Found'],
          ['events', 'Events'],
          ['property', 'Property'],
          ['sos', 'SOS'],
        ].map(([value, label]) => (
          <button
            key={value}
            onClick={() => setActiveTab(value as any)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${activeTab === value ? 'bg-[#57cf85] text-white' : theme === 'dark' ? 'bg-[#1F1F1F] text-slate-300' : 'bg-white text-slate-600 border border-slate-200'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'services' ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {loading ? <AdminPanel theme={theme} className="p-6"><p className={`text-sm ${styles.mutedText}`}>Loading services...</p></AdminPanel> : null}
          {!loading && filteredServices.length === 0 ? <AdminPanel theme={theme} className="p-6"><p className={`text-sm ${styles.mutedText}`}>No service listings match the current search.</p></AdminPanel> : null}
          {filteredServices.map((item) => (
            <AdminPanel key={item._id} theme={theme} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className={`text-lg font-semibold ${styles.pageTitle}`}>{item.title}</h3>
                  <p className={`mt-1 text-sm ${styles.mutedText}`}>{item.category} • {item.owner?.providerProfile?.businessName || item.owner?.name || 'Unknown provider'}</p>
                  <p className={`mt-1 text-sm ${styles.mutedText}`}>{item.location || 'Location not added'} • {item.phone}</p>
                </div>
                <StatusBadge label={item.isAvailable ? 'Available' : 'Paused'} tone={item.isAvailable ? 'green' : 'amber'} />
              </div>
              <p className={`mt-4 text-sm leading-6 ${styles.pageTitle}`}>{item.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => updateServiceAvailability(item)} className="rounded-xl bg-[#57cf85]/12 px-3 py-2 text-sm font-medium text-[#57cf85]">
                  {item.isAvailable ? 'Pause Listing' : 'Reopen Listing'}
                </button>
                <button onClick={() => deleteRecord('services', item._id)} className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">Delete</button>
              </div>
            </AdminPanel>
          ))}
        </div>
      ) : null}

      {activeTab === 'lostfound' ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {loading ? <AdminPanel theme={theme} className="p-6"><p className={`text-sm ${styles.mutedText}`}>Loading lost and found records...</p></AdminPanel> : null}
          {!loading && filteredLostFound.length === 0 ? <AdminPanel theme={theme} className="p-6"><p className={`text-sm ${styles.mutedText}`}>No lost and found records match the current search.</p></AdminPanel> : null}
          {filteredLostFound.map((item) => (
            <AdminPanel key={item._id} theme={theme} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className={`text-lg font-semibold ${styles.pageTitle}`}>{item.itemName}</h3>
                  <p className={`mt-1 text-sm ${styles.mutedText}`}>{item.type.toUpperCase()} • {item.location}</p>
                  <p className={`mt-1 text-sm ${styles.mutedText}`}>{item.owner?.name || 'Unknown owner'} • {item.contactPhone}</p>
                </div>
                <StatusBadge label={item.status === 'claimed' ? 'Claimed' : 'Open'} tone={item.status === 'claimed' ? 'green' : 'amber'} />
              </div>
              {item.image ? (
                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                  <img
                    src={resolveMediaUrl(item.image)}
                    alt={item.itemName}
                    className="h-48 w-full object-cover"
                  />
                </div>
              ) : null}
              <p className={`mt-4 text-sm leading-6 ${styles.pageTitle}`}>{item.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => updateLostFoundStatus(item, item.status === 'open' ? 'claimed' : 'open')} className="rounded-xl bg-[#57cf85]/12 px-3 py-2 text-sm font-medium text-[#57cf85]">
                  Mark {item.status === 'open' ? 'Claimed' : 'Open'}
                </button>
                <button onClick={() => deleteRecord('lost-found', item._id)} className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">Delete</button>
              </div>
            </AdminPanel>
          ))}
        </div>
      ) : null}

      {activeTab === 'events' ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={startCreateEvent} className="rounded-2xl bg-[#57cf85] px-4 py-3 text-sm font-semibold text-white">Create Event</button>
          </div>

          {eventForm ? (
            <AdminPanel theme={theme} className="p-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[
                  ['title', 'Title'],
                  ['date', 'Date'],
                  ['time', 'Time'],
                  ['location', 'Location'],
                  ['capacity', 'Capacity'],
                  ['attendeesBaseline', 'Attendees Baseline'],
                  ['category', 'Category'],
                  ['status', 'Status'],
                ].map(([field, label]) => (
                  <div key={field}>
                    <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.15em] ${styles.mutedText}`}>{label}</label>
                    <input
                      value={eventForm[field] ?? ''}
                      onChange={(event) => setEventForm((prev: any) => ({ ...prev, [field]: event.target.value }))}
                      className={`w-full rounded-2xl border px-4 py-3 text-sm ${styles.input}`}
                    />
                  </div>
                ))}
                <div className="md:col-span-2">
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.15em] ${styles.mutedText}`}>Description</label>
                  <textarea
                    value={eventForm.description}
                    onChange={(event) => setEventForm((prev: any) => ({ ...prev, description: event.target.value }))}
                    className={`min-h-[120px] w-full rounded-2xl border px-4 py-3 text-sm ${styles.input}`}
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-3">
                <button onClick={() => { setEventForm(null); setEditingEventId(null); }} className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">Cancel</button>
                <button onClick={saveEvent} disabled={saving} className="rounded-2xl bg-[#57cf85] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                  {saving ? 'Saving...' : editingEventId ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </AdminPanel>
          ) : null}

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {loading ? <AdminPanel theme={theme} className="p-6"><p className={`text-sm ${styles.mutedText}`}>Loading events...</p></AdminPanel> : null}
            {!loading && filteredEvents.length === 0 ? <AdminPanel theme={theme} className="p-6"><p className={`text-sm ${styles.mutedText}`}>No event records match the current search.</p></AdminPanel> : null}
            {filteredEvents.map((item) => (
              <AdminPanel key={item._id} theme={theme} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className={`text-lg font-semibold ${styles.pageTitle}`}>{item.title}</h3>
                    <p className={`mt-1 text-sm ${styles.mutedText}`}>{item.date} • {item.time} • {item.location}</p>
                  </div>
                  <StatusBadge label={item.status} tone={item.status === 'completed' ? 'green' : item.status === 'cancelled' ? 'red' : 'blue'} />
                </div>
                <p className={`mt-4 text-sm leading-6 ${styles.pageTitle}`}>{item.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <StatusBadge label={`${item.currentAttendees || 0} attendees`} tone="slate" />
                  <StatusBadge label={`Capacity ${item.capacity || 0}`} tone="slate" />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => startEditEvent(item)} className="rounded-xl bg-[#57cf85]/12 px-3 py-2 text-sm font-medium text-[#57cf85]">Edit</button>
                  <button onClick={() => deleteRecord('events', item._id)} className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">Delete</button>
                </div>
              </AdminPanel>
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === 'property' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className={`text-sm ${styles.mutedText}`}>
              Showing page {propertyMeta.page} of {Math.max(Math.ceil((propertyMeta.total || 0) / (propertyMeta.limit || PROPERTY_PAGE_SIZE)), 1)}
              {propertySearchKey ? ` for "${propertySearchKey}"` : ''}
            </p>
            <p className={`text-sm ${styles.mutedText}`}>{propertyMeta.total} matching listings</p>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {loading ? <AdminPanel theme={theme} className="p-6"><p className={`text-sm ${styles.mutedText}`}>Loading property listings...</p></AdminPanel> : null}
          {!loading && filteredProperties.length === 0 ? <AdminPanel theme={theme} className="p-6"><p className={`text-sm ${styles.mutedText}`}>No property listings match the current search.</p></AdminPanel> : null}
          {filteredProperties.map((item) => (
            <AdminPanel key={item._id} theme={theme} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className={`text-lg font-semibold ${styles.pageTitle}`}>{item.unit}</h3>
                  <p className={`mt-1 text-sm ${styles.mutedText}`}>{item.ownerName} • {item.listingType.toUpperCase()} • {item.propertyType}</p>
                </div>
                <StatusBadge label={item.status} tone={item.status === 'active' ? 'green' : item.status === 'pending' ? 'amber' : item.status === 'rejected' ? 'red' : 'slate'} />
              </div>
              <p className={`mt-4 text-sm ${styles.pageTitle}`}>{item.price} • {item.area || 'Area N/A'} • {item.bedrooms || '0'} bed • {item.bathrooms || '0'} bath</p>
              <p className={`mt-3 text-sm leading-6 ${styles.mutedText}`}>{item.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(['active', 'pending', 'closed', 'rejected'] as Array<PropertyRecord['status']>).map((status) => (
                  <button
                    key={status}
                    onClick={() => updatePropertyStatus(item, status)}
                    className={`rounded-xl px-3 py-2 text-sm font-medium ${item.status === status ? 'bg-[#57cf85] text-white' : 'bg-slate-100 text-slate-700'}`}
                  >
                    {status}
                  </button>
                ))}
                <button onClick={() => deleteRecord('properties', item._id)} className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">Delete</button>
              </div>
            </AdminPanel>
          ))}
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setPropertyPage((currentPage) => Math.max(currentPage - 1, 1))}
              disabled={propertyMeta.page <= 1}
              className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPropertyPage((currentPage) => currentPage + 1)}
              disabled={!propertyMeta.hasMore}
              className="rounded-xl bg-[#57cf85] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}

      {activeTab === 'sos' ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <AdminPanel theme={theme} className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className={`text-lg font-semibold ${styles.pageTitle}`}>Emergency Contacts</h3>
                <p className={`mt-1 text-sm ${styles.mutedText}`}>Manage the contact list that powers the resident SOS screen.</p>
              </div>
              <button onClick={startCreateContact} className="rounded-2xl bg-[#57cf85] px-4 py-3 text-sm font-semibold text-white">Add Contact</button>
            </div>

            {contactForm ? (
              <div className="mt-4 rounded-3xl border border-[#57cf85]/20 bg-[#57cf85]/12 p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {[
                    ['title', 'Title'],
                    ['number', 'Number'],
                    ['group', 'Group'],
                    ['order', 'Display Order'],
                  ].map(([field, label]) => (
                    <div key={field}>
                      <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.15em] ${styles.mutedText}`}>{label}</label>
                      <input
                        value={contactForm[field] ?? ''}
                        onChange={(event) => setContactForm((prev: any) => ({ ...prev, [field]: event.target.value }))}
                        className={`w-full rounded-2xl border px-4 py-3 text-sm ${styles.input}`}
                      />
                    </div>
                  ))}
                  <div className="md:col-span-2">
                    <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.15em] ${styles.mutedText}`}>Description</label>
                    <textarea
                      value={contactForm.description || ''}
                      onChange={(event) => setContactForm((prev: any) => ({ ...prev, description: event.target.value }))}
                      className={`min-h-[90px] w-full rounded-2xl border px-4 py-3 text-sm ${styles.input}`}
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-3">
                  <button onClick={() => { setContactForm(null); setEditingContactId(null); }} className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">Cancel</button>
                  <button onClick={saveContact} disabled={saving} className="rounded-2xl bg-[#57cf85] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                    {saving ? 'Saving...' : editingContactId ? 'Update Contact' : 'Create Contact'}
                  </button>
                </div>
              </div>
            ) : null}

            <div className="mt-4 space-y-3">
              {filteredContacts.map((item) => (
                <div key={item._id || item.title} className={`rounded-2xl border p-4 ${styles.panel}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={`font-semibold ${styles.pageTitle}`}>{item.title}</p>
                    <p className={`mt-1 text-sm ${styles.mutedText}`}>{item.number} • {item.group || 'emergency'}</p>
                      <p className={`mt-1 text-sm ${styles.mutedText}`}>{item.description || 'No description added.'}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEditContact(item)} className="rounded-xl bg-[#57cf85]/12 px-3 py-2 text-sm font-medium text-[#57cf85]">Edit</button>
                      {item._id ? <button onClick={() => deleteRecord('sos-contact', item._id!)} className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">Delete</button> : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </AdminPanel>

          <AdminPanel theme={theme} className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className={`text-lg font-semibold ${styles.pageTitle}`}>Live SOS Alerts</h3>
                <p className={`mt-1 text-sm ${styles.mutedText}`}>Monitor open emergency alerts as they come in from the app.</p>
              </div>
              <LifeBuoy className="h-5 w-5 text-red-500" />
            </div>

            <div className="mt-4 space-y-3">
              {filteredAlerts.length === 0 ? (
                <div className={`rounded-2xl border p-4 ${styles.panel}`}>
                  <p className={`text-sm ${styles.mutedText}`}>No SOS alerts match the current search.</p>
                </div>
              ) : (
                filteredAlerts.map((item) => (
                  <div key={item._id} className={`rounded-2xl border p-4 ${styles.panel}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className={`font-semibold ${styles.pageTitle}`}>{item.userName}</p>
                        <p className={`mt-1 text-sm ${styles.mutedText}`}>{item.contactTitle} • {item.contactNumber}</p>
                        <p className={`mt-1 text-sm ${styles.mutedText}`}>{item.notes || 'No additional notes provided.'}</p>
                        <p className={`mt-1 text-xs ${styles.mutedText}`}>Triggered {formatDateTime(item.createdAt)}</p>
                      </div>
                      <StatusBadge label={item.status} tone={item.status === 'resolved' ? 'green' : item.status === 'cancelled' ? 'red' : 'amber'} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {(['open', 'acknowledged', 'resolved', 'cancelled'] as Array<SosAlert['status']>).map((status) => (
                        <button
                          key={status}
                          onClick={() => updateAlertStatus(item, status)}
                          className={`rounded-xl px-3 py-2 text-sm font-medium ${item.status === status ? 'bg-[#57cf85] text-white' : 'bg-slate-100 text-slate-700'}`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </AdminPanel>
        </div>
      ) : null}
    </div>
  );
}
