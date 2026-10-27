import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { AlertCircle } from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
export const Fines = () => {
    const [fines, setFines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusTab, setStatusTab] = useState('');
    const [meta, setMeta] = useState({});
    // Pay Modal
    const [payModalOpen, setPayModalOpen] = useState(false);
    const [selectedFine, setSelectedFine] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [payLoading, setPayLoading] = useState(false);
    // Waive Modal
    const [waiveModalOpen, setWaiveModalOpen] = useState(false);
    const [waiveReason, setWaiveReason] = useState('');
    const [waiveLoading, setWaiveLoading] = useState(false);
    const [waiveError, setWaiveError] = useState('');
    const fetchFines = async () => {
        try {
            setLoading(true);
            const url = statusTab ? `/fines?status=${statusTab}` : '/fines';
            const res = await api.get(url);
            if (res.data.success) {
                setFines(res.data.data);
                setMeta(res.data.meta);
            }
        }
        catch (err) {
            console.error(err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchFines();
    }, [statusTab]);
    const handleOpenPay = (fine) => {
        setSelectedFine(fine);
        setPaymentMethod('cash');
        setPayModalOpen(true);
    };
    const handleConfirmPay = async (e) => {
        e.preventDefault();
        if (!selectedFine)
            return;
        setPayLoading(true);
        try {
            await api.post(`/fines/${selectedFine.id}/pay`, { method: paymentMethod });
            setPayModalOpen(false);
            fetchFines();
        }
        catch (err) {
            alert(err.response?.data?.error?.message || 'Failed to record payment');
        }
        finally {
            setPayLoading(false);
        }
    };
    const handleOpenWaive = (fine) => {
        setSelectedFine(fine);
        setWaiveReason('');
        setWaiveError('');
        setWaiveModalOpen(true);
    };
    const handleConfirmWaive = async (e) => {
        e.preventDefault();
        if (!selectedFine)
            return;
        if (!waiveReason.trim()) {
            setWaiveError('Please enter a reason for waiving this fine.');
            return;
        }
        setWaiveLoading(true);
        try {
            await api.post(`/fines/${selectedFine.id}/waive`, { reason: waiveReason });
            setWaiveModalOpen(false);
            fetchFines();
        }
        catch (err) {
            setWaiveError(err.response?.data?.error?.message || 'Failed to waive fine');
        }
        finally {
            setWaiveLoading(false);
        }
    };
    return (<div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#1A2238]">Fines Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Review overdue penalties, record cash/card payments, and process fee waivers
          </p>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-rose-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
              Total Unpaid Fines
            </div>
            <div className="font-serif text-2xl font-bold text-gray-900 mt-1">
              LKR {meta.totalUnpaidAmount || 0}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            !
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-emerald-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
              Total Collected
            </div>
            <div className="font-serif text-2xl font-bold text-gray-900 mt-1">
              LKR {meta.totalPaidAmount || 0}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            ✓
          </div>
        </div>
      </div>

      {/* Segmented Filter */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white rounded-2xl border border-gray-100 shadow-sm w-fit">
        {[
            { id: '', label: 'All Fines' },
            { id: 'unpaid', label: 'Unpaid' },
            { id: 'paid', label: 'Paid' },
            { id: 'waived', label: 'Waived' }
        ].map((tab) => (<button key={tab.id} onClick={() => setStatusTab(tab.id)} className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${statusTab === tab.id
                ? 'bg-[#1E3A5F] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'}`}>
            {tab.label}
          </button>))}
      </div>

      {/* Fines Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase font-semibold">
            <tr>
              <th className="py-3 px-4">Member</th>
              <th className="py-3 px-4">Book Title</th>
              <th className="py-3 px-4">Days Overdue</th>
              <th className="py-3 px-4">Amount</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (<tr>
                <td colSpan={6} className="py-8 text-center text-gray-400">
                  Loading fines...
                </td>
              </tr>) : fines.length === 0 ? (<tr>
                <td colSpan={6} className="py-8 text-center text-gray-400">
                  No fine records found.
                </td>
              </tr>) : (fines.map((f) => (<tr key={f.id} className="hover:bg-gray-50/50">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-gray-800">{f.member?.name}</div>
                    <div className="text-[11px] text-gray-400 font-mono">
                      {f.member?.memberId}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-700">
                    {f.loan?.book?.title || 'Unknown Book'}
                  </td>
                  <td className="py-3 px-4 text-gray-600">{f.daysLate} days late</td>
                  <td className="py-3 px-4 font-bold text-gray-900 font-mono">
                    LKR {f.amount}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={f.status}/>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {f.status === 'unpaid' && (<div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleOpenPay(f)} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition">
                          Collect
                        </button>
                        <button onClick={() => handleOpenWaive(f)} className="px-3 py-1 text-gray-600 hover:bg-gray-100 border border-gray-200 rounded-lg transition">
                          Waive
                        </button>
                      </div>)}
                    {f.status === 'paid' && (<span className="text-[11px] text-gray-400">
                        Paid via {f.paymentMethod}
                      </span>)}
                    {f.status === 'waived' && (<span className="text-[11px] text-gray-400 italic">
                        "{f.waiveReason}"
                      </span>)}
                  </td>
                </tr>)))}
          </tbody>
        </table>
      </div>

      {/* Collect Fine Modal */}
      <Modal isOpen={payModalOpen} onClose={() => setPayModalOpen(false)} title="Record Fine Payment">
        <form onSubmit={handleConfirmPay} className="space-y-4 text-xs">
          <div className="p-3 bg-gray-50 rounded-xl">
            <div className="text-gray-500">Patron: {selectedFine?.member?.name}</div>
            <div className="font-serif text-lg font-bold text-gray-900 mt-1">
              Amount Due: LKR {selectedFine?.amount}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Payment Method</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]">
              <option value="cash">Cash Payment</option>
              <option value="card">Card / POS</option>
              <option value="other">Bank Transfer / Other</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button type="button" onClick={() => setPayModalOpen(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition">
              Cancel
            </button>
            <button type="submit" disabled={payLoading} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition shadow-sm disabled:opacity-50">
              {payLoading ? 'Saving...' : 'Confirm Payment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Waive Fine Modal */}
      <Modal isOpen={waiveModalOpen} onClose={() => setWaiveModalOpen(false)} title="Waive Fine Penalty">
        <form onSubmit={handleConfirmWaive} className="space-y-4 text-xs">
          {waiveError && (<div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0"/>
              <span>{waiveError}</span>
            </div>)}

          <div className="p-3 bg-gray-50 rounded-xl">
            <div className="text-gray-500">Patron: {selectedFine?.member?.name}</div>
            <div className="font-serif text-lg font-bold text-gray-900 mt-1">
              Waiving: LKR {selectedFine?.amount}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Reason for Waiving * (Required by Library Policy)
            </label>
            <textarea rows={3} required value={waiveReason} onChange={(e) => setWaiveReason(e.target.value)} placeholder="e.g. Medical emergency or documented system issue..." className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button type="button" onClick={() => setWaiveModalOpen(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition">
              Cancel
            </button>
            <button type="submit" disabled={waiveLoading} className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl transition shadow-sm disabled:opacity-50">
              {waiveLoading ? 'Waiving...' : 'Confirm Waiver'}
            </button>
          </div>
        </form>
      </Modal>
    </div>);
};
