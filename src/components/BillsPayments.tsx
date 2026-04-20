import { useMemo, useState } from 'react';
import { BanknoteArrowUp, CreditCard, Receipt, Send } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';
import { getApiErrorMessage } from '../utils/apiErrors';
import { AdminPanel, ApiStatusBanner, PageIntro, StatusBadge, formatDateTime, getAdminTheme, useLiveRefresh } from './AdminShared';

type Bill = {
  _id: string;
  userId?: string | {
    _id?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  type: string;
  provider: string;
  billId: string;
  referenceId: string;
  amount: number;
  status: 'paid' | 'due' | 'upcoming' | 'failed';
  dueDate: string;
  billingMonth: string;
  paidDate?: string;
  method?: string;
};

type Transaction = {
  _id: string;
  orderId: string;
  amount: number;
  currency?: string;
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  paymentMethod?: string;
  createdAt?: string;
  updatedAt?: string;
  userId?: string | {
    _id?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  billId?: {
    type?: string;
    amount?: number;
    dueDate?: string;
    status?: string;
    referenceId?: string;
    billId?: string;
  };
};

type ResidentDirectoryEntry = {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
};

const defaultDispatchState = () => ({
  types: ['maintenance'] as string[],
  month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
  dueDate: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString().split('T')[0],
});

export function BillsPayments({ searchQuery = '' }: { searchQuery?: string }) {
  const { theme } = useTheme();
  const styles = getAdminTheme(theme);
  const [activeTab, setActiveTab] = useState<'billing' | 'payments'>('billing');
  const [bills, setBills] = useState<Bill[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [residentDirectory, setResidentDirectory] = useState<ResidentDirectoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchData, setDispatchData] = useState(defaultDispatchState());

  const loadFinance = async () => {
    try {
      const [billRes, transactionRes, residentRes] = await Promise.all([
        api.get('/admin/bills'),
        api.get('/admin/transactions'),
        api.get('/admin/users'),
      ]);
      setBills(Array.isArray(billRes.data) ? billRes.data : []);
      setTransactions(Array.isArray(transactionRes.data) ? transactionRes.data : []);
      setResidentDirectory(Array.isArray(residentRes.data) ? residentRes.data : []);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch finance data', error);
      setError(getApiErrorMessage(error, 'Billing data could not be loaded.'));
    } finally {
      setLoading(false);
    }
  };

  useLiveRefresh(loadFinance, 15000, []);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const matches = (...values: Array<string | number | undefined>) =>
    !normalizedQuery || values.filter((value) => value !== undefined && value !== null).join(' ').toLowerCase().includes(normalizedQuery);

  const residentDirectoryMap = useMemo(() => {
    const map = new Map<string, ResidentDirectoryEntry>();
    residentDirectory.forEach((resident) => {
      if (resident?._id) {
        map.set(String(resident._id), resident);
      }
    });
    return map;
  }, [residentDirectory]);

  const resolveResident = (userValue?: Bill['userId'] | Transaction['userId']) => {
    if (!userValue) return undefined;

    if (typeof userValue === 'string') {
      return residentDirectoryMap.get(userValue);
    }

    const residentMatch = userValue._id ? residentDirectoryMap.get(String(userValue._id)) : undefined;

    return {
      _id: userValue._id,
      name: userValue.name || residentMatch?.name,
      email: userValue.email || residentMatch?.email,
      phone: userValue.phone || residentMatch?.phone,
    };
  };

  const filteredBills = useMemo(
    () =>
      bills.filter((bill) =>
        matches(
          resolveResident(bill.userId)?.name,
          resolveResident(bill.userId)?.email,
          bill.type,
          bill.provider,
          bill.billingMonth,
          bill.referenceId,
          bill.billId,
          bill.amount,
          bill.status,
        ),
      ),
    [bills, normalizedQuery, residentDirectoryMap],
  );

  const filteredTransactions = useMemo(
    () =>
      transactions.filter((txn) =>
        matches(
          resolveResident(txn.userId)?.name,
          resolveResident(txn.userId)?.email,
          txn.orderId,
          txn.status,
          txn.paymentMethod,
          txn.billId?.referenceId,
          txn.billId?.billId,
          txn.amount,
        ),
      ),
    [normalizedQuery, residentDirectoryMap, transactions],
  );

  const stats = [
    { label: 'Bills', value: bills.length, icon: Receipt },
    { label: 'Due Bills', value: bills.filter((item) => item.status === 'due').length, icon: BanknoteArrowUp },
    { label: 'Transactions', value: transactions.length, icon: CreditCard },
    { label: 'Successful Payments', value: transactions.filter((item) => item.status === 'success').length, icon: CreditCard },
  ];

  const handleDispatch = async () => {
    setProcessing(true);
    try {
      await api.post('/admin/bills/dispatch', dispatchData);
      setDispatchData(defaultDispatchState());
      setShowDispatchModal(false);
      await loadFinance();
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Bills could not be dispatched.');
    } finally {
      setProcessing(false);
    }
  };

  const toggleBillStatus = async (bill: Bill) => {
    const nextStatus = bill.status === 'paid' ? 'due' : 'paid';
    try {
      const response = await api.put(`/admin/bills/${bill._id}/status`, { status: nextStatus });
      setBills((prev) => prev.map((item) => (item._id === bill._id ? { ...item, ...response.data } : item)));
    } catch (error: any) {
      alert(error?.response?.data?.message || 'The bill status could not be updated.');
    }
  };

  const deleteBill = async (billId: string) => {
    if (!window.confirm('Delete this bill from the live billing system?')) return;
    try {
      await api.delete(`/admin/bills/${billId}`);
      setBills((prev) => prev.filter((item) => item._id !== billId));
    } catch (error: any) {
      alert(error?.response?.data?.message || 'The bill could not be deleted.');
    }
  };

  return (
    <div className="space-y-6">
      <PageIntro
        theme={theme}
        title="Billing & Payments"
        description="Dispatch resident bills, track paid and due balances, and monitor the full online payment pipeline."
        actions={
          <button onClick={() => setShowDispatchModal(true)} className="rounded-2xl bg-[#57cf85] px-4 py-3 text-sm font-semibold text-white">
            Dispatch Bills
          </button>
        }
      />

      {error ? (
        <ApiStatusBanner
          title="Billing data is offline"
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
          ['billing', 'Billing'],
          ['payments', 'Online Payments'],
        ].map(([value, label]) => (
          <button
            key={value}
            onClick={() => setActiveTab(value as 'billing' | 'payments')}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${activeTab === value ? 'bg-[#57cf85] text-white' : theme === 'dark' ? 'bg-[#1F1F1F] text-slate-300' : 'bg-white text-slate-600 border border-slate-200'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'billing' ? (
        <AdminPanel theme={theme} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className={`${styles.tableHeader} border-b`}>
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em]">Resident</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em]">Bill</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em]">Amount</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em]">Status</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em]">Dates</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-500">Loading bills...</td>
                  </tr>
                ) : filteredBills.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-500">No bills match the current search.</td>
                  </tr>
                ) : (
                  filteredBills.map((bill) => (
                    <tr key={bill._id} className={`${styles.tableRow} border-b align-top`}>
                      <td className="px-5 py-4">
                        <div className={`font-semibold ${styles.pageTitle}`}>{resolveResident(bill.userId)?.name || 'Resident'}</div>
                        <div className={`mt-1 text-sm ${styles.mutedText}`}>{resolveResident(bill.userId)?.email || 'Email unavailable'}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className={`font-medium ${styles.pageTitle}`}>{bill.type}</div>
                        <div className={`mt-1 text-sm ${styles.mutedText}`}>{bill.provider}</div>
                        <div className={`mt-1 text-xs ${styles.mutedText}`}>Bill ID {bill.billId} • Ref {bill.referenceId}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className={`font-semibold ${styles.pageTitle}`}>PKR {Number(bill.amount || 0).toLocaleString()}</div>
                        <div className={`mt-1 text-sm ${styles.mutedText}`}>{bill.billingMonth}</div>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge
                          label={bill.status}
                          tone={bill.status === 'paid' ? 'green' : bill.status === 'failed' ? 'red' : bill.status === 'upcoming' ? 'blue' : 'amber'}
                        />
                      </td>
                      <td className="px-5 py-4">
                        <div className={`text-sm ${styles.pageTitle}`}>Due {bill.dueDate}</div>
                        <div className={`mt-1 text-xs ${styles.mutedText}`}>Paid {formatDateTime(bill.paidDate)}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => toggleBillStatus(bill)} className="rounded-xl bg-[#57cf85]/12 px-3 py-2 text-sm font-medium text-[#57cf85]">
                            Mark {bill.status === 'paid' ? 'Due' : 'Paid'}
                          </button>
                          <button onClick={() => deleteBill(bill._id)} className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                            Delete
                          </button>
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

      {activeTab === 'payments' ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {loading ? <AdminPanel theme={theme} className="p-6"><p className={`text-sm ${styles.mutedText}`}>Loading transactions...</p></AdminPanel> : null}
          {!loading && filteredTransactions.length === 0 ? <AdminPanel theme={theme} className="p-6"><p className={`text-sm ${styles.mutedText}`}>No payment transactions match the current search.</p></AdminPanel> : null}
          {filteredTransactions.map((txn) => (
            <AdminPanel key={txn._id} theme={theme} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className={`text-lg font-semibold ${styles.pageTitle}`}>{txn.orderId}</h3>
                  <p className={`mt-1 text-sm ${styles.mutedText}`}>{resolveResident(txn.userId)?.name || 'Unknown user'} • {resolveResident(txn.userId)?.email || 'Email unavailable'}</p>
                </div>
                <StatusBadge
                  label={txn.status}
                  tone={txn.status === 'success' ? 'green' : txn.status === 'failed' || txn.status === 'cancelled' ? 'red' : 'amber'}
                />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className={`rounded-2xl border p-3 ${styles.panel}`}>
                  <p className={`text-xs uppercase tracking-[0.15em] ${styles.mutedText}`}>Payment</p>
                  <p className={`mt-2 text-sm ${styles.pageTitle}`}>PKR {Number(txn.amount || 0).toLocaleString()} {txn.currency || 'PKR'}</p>
                  <p className={`mt-1 text-xs ${styles.mutedText}`}>{txn.paymentMethod || 'Method pending'}</p>
                </div>
                <div className={`rounded-2xl border p-3 ${styles.panel}`}>
                  <p className={`text-xs uppercase tracking-[0.15em] ${styles.mutedText}`}>Linked Bill</p>
                  <p className={`mt-2 text-sm ${styles.pageTitle}`}>{txn.billId?.type || 'No bill linked'}</p>
                  <p className={`mt-1 text-xs ${styles.mutedText}`}>{txn.billId?.referenceId || txn.billId?.billId || 'Reference unavailable'}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <StatusBadge label={`Created ${formatDateTime(txn.createdAt)}`} tone="slate" />
                <StatusBadge label={`Updated ${formatDateTime(txn.updatedAt)}`} tone="slate" />
              </div>
            </AdminPanel>
          ))}
        </div>
      ) : null}

      {showDispatchModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className={`${styles.card} w-full max-w-xl rounded-[28px] border p-6 shadow-2xl`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className={`text-xl font-semibold ${styles.pageTitle}`}>Dispatch Monthly Bills</h3>
                <p className={`mt-1 text-sm ${styles.mutedText}`}>Generate connected bills for all registered residents.</p>
              </div>
              <button onClick={() => setShowDispatchModal(false)} className="rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">Close</button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.15em] ${styles.mutedText}`}>Bill Types</label>
                <div className="flex flex-wrap gap-3">
                  {['electricity', 'gas', 'maintenance'].map((type) => {
                    const selected = dispatchData.types.includes(type);
                    return (
                      <button
                        key={type}
                        onClick={() =>
                          setDispatchData((prev) => ({
                            ...prev,
                            types: selected ? prev.types.filter((item) => item !== type) : [...prev.types, type],
                          }))
                        }
                        className={`rounded-full px-4 py-2 text-sm font-semibold ${selected ? 'bg-[#57cf85] text-white' : 'bg-slate-100 text-slate-700'}`}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.15em] ${styles.mutedText}`}>Billing Month</label>
                  <input
                    value={dispatchData.month}
                    onChange={(event) => setDispatchData((prev) => ({ ...prev, month: event.target.value }))}
                    className={`w-full rounded-2xl border px-4 py-3 text-sm ${styles.input}`}
                  />
                </div>
                <div>
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.15em] ${styles.mutedText}`}>Due Date</label>
                  <input
                    type="date"
                    value={dispatchData.dueDate}
                    onChange={(event) => setDispatchData((prev) => ({ ...prev, dueDate: event.target.value }))}
                    className={`w-full rounded-2xl border px-4 py-3 text-sm ${styles.input}`}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowDispatchModal(false)} className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">Cancel</button>
              <button onClick={handleDispatch} disabled={processing || dispatchData.types.length === 0} className="inline-flex items-center gap-2 rounded-2xl bg-[#57cf85] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                <Send className="h-4 w-4" />
                {processing ? 'Dispatching...' : 'Dispatch Bills'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
