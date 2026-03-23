import { useState, useEffect } from 'react';
import { Upload, Download, CheckCircle, XCircle, Send, Eye, Edit, Trash2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';

interface Bill {
  _id: string;
  userId: {
    name: string;
  };
  type: string;
  month: string;
  amount: number;
  status: string;
  dueDate: string;
  paidDate?: string;
}

export function BillsPayments() {
  const { theme } = useTheme();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [dispatchData, setDispatchData] = useState({
    types: [] as string[],
    month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
    dueDate: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString().split('T')[0]
  });

  const handleDispatch = async () => {
    setProcessing(true);
    try {
      await api.post('/admin/bills/dispatch', dispatchData);
      alert('Bills generated successfully for all verified residents');
      setDispatchData({
        types: [],
        month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
        dueDate: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString().split('T')[0]
      });
    } catch (error: any) {
      console.error(error);
      alert(`Failed to dispatch bills: ${error.response?.data?.message || error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const fetchBills = async () => {
    try {
      const response = await api.get('/admin/bills');
      setBills(response.data);
    } catch (error) {
      console.error("Failed to fetch bills", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const handleToggleStatus = async (bill: Bill) => {
    const newStatus = bill.status === 'paid' ? 'due' : 'paid';
    try {
      await api.put(`/admin/bills/${bill._id}/status`, { status: newStatus });
      // Refresh list locally
      setBills(bills.map(b => b._id === bill._id ? { ...b, status: newStatus, paidDate: newStatus === 'paid' ? new Date().toISOString() : undefined } : b));
    } catch (error) {
      console.error("Failed to update bill", error);
      alert("Failed to update bill status");
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="space-y-6">

      {/* Dispatch Bill Modal */}
      {
        showDispatchModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className={`p-6 rounded-xl w-full max-w-md ${theme === 'dark' ? 'bg-[#1F1F1F] text-white' : 'bg-white text-gray-900'}`}>
              <h3 className="text-xl font-semibold mb-4">Dispatch Monthly Bills</h3>
              <div className="space-y-4">

                {/* Multi-Select Types */}
                <div>
                  <label className="block text-sm mb-2 text-gray-400">Select Bill Types</label>
                  <div className="flex gap-4">
                    {['Maintenance'].map(type => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={dispatchData.types.includes(type)}
                          onChange={(e) => {
                            if (e.target.checked) setDispatchData({ ...dispatchData, types: [...dispatchData.types, type] });
                            else setDispatchData({ ...dispatchData, types: dispatchData.types.filter(t => t !== type) });
                          }}
                          className="rounded border-gray-600 bg-transparent text-green-500 focus:ring-green-500"
                        />
                        <span>{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-1 text-gray-400">Billing Month</label>
                  <input className="w-full p-2 rounded border border-gray-600 bg-transparent" placeholder="e.g. January 2025" value={dispatchData.month} onChange={e => setDispatchData({ ...dispatchData, month: e.target.value })} />
                </div>

                <div>
                  <label className="block text-sm mb-1 text-gray-400">Due Date</label>
                  <input className="w-full p-2 rounded border border-gray-600 bg-transparent" type="date" value={dispatchData.dueDate} onChange={e => setDispatchData({ ...dispatchData, dueDate: e.target.value })} />
                </div>

                <div className="flex gap-2 justify-end mt-6">
                  <button onClick={() => setShowDispatchModal(false)} className="px-4 py-2 rounded bg-gray-500 text-white">Cancel</button>
                  <button onClick={handleDispatch} disabled={processing || dispatchData.types.length === 0} className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-50">
                    {processing ? 'Processing...' : 'Dispatch All'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl ${theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>Bills & Payments</h2>
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Manage utility bills and track payment status</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowDispatchModal(true)}
            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-[#00c878] to-[#00e68a] text-white rounded-xl hover:shadow-lg transition-shadow">
            <Send className="w-5 h-5" />
            Dispatch Monthly Bills
          </button>
        </div>
      </div>

      <div className={`${theme === 'dark' ? 'bg-[#1F1F1F] border-[#333333]' : 'bg-white border-gray-100'} rounded-xl shadow-sm border overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${theme === 'dark' ? 'bg-[#1A1A1A] border-[#333333]' : 'bg-gray-50 border-gray-200'} border-b`}>
              <tr>
                <th className={`px-6 py-4 text-left ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Resident Name</th>
                <th className={`px-6 py-4 text-left ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Billing Month</th>
                <th className={`px-6 py-4 text-left ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Type</th>
                <th className={`px-6 py-4 text-left ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Amount</th>
                <th className={`px-6 py-4 text-left ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Payment Status</th>
                <th className={`px-6 py-4 text-left ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Payment Date</th>
                <th className={`px-6 py-4 text-left ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Actions</th>
              </tr>
            </thead>
            <tbody className={`${theme === 'dark' ? 'divide-[#333333]' : 'divide-gray-200'} divide-y`}>
              {loading ? <p className="p-4">Loading bills...</p> : bills.map((bill) => (
                <tr key={bill._id} className={theme === 'dark' ? 'hover:bg-[#2A2A2A]' : 'hover:bg-gray-50'}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#00c878] to-[#00e68a] flex items-center justify-center text-white">
                        {bill.userId?.name.charAt(0)}
                      </div>
                      <span className={theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}>{bill.userId?.name}</span>
                    </div>
                  </td>
                  <td className={`px-6 py-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{bill.month}</td>
                  <td className={`px-6 py-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{bill.type}</td>
                  <td className={`px-6 py-4 ${theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>Rs {bill.amount}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleStatus(bill)}
                      className="focus:outline-none"
                    >
                      {bill.status === 'paid' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-50 text-green-600 text-sm cursor-pointer hover:bg-green-100">
                          <CheckCircle className="w-4 h-4" />
                          Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-50 text-red-600 text-sm cursor-pointer hover:bg-red-100">
                          <XCircle className="w-4 h-4" />
                          Unpaid
                        </span>
                      )}
                    </button>
                  </td>
                  <td className={`px-6 py-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{formatDate(bill.paidDate)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {/* Actions placeholders */}
                      <button className={`p-2 ${theme === 'dark' ? 'hover:bg-[#2A2A2A]' : 'hover:bg-gray-100'} rounded-lg transition-colors`} title="View Bill">
                        <Eye className={`w-5 h-5 ${theme === 'dark' ? 'text-white opacity-70' : 'text-gray-600'}`} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div >
  );
}