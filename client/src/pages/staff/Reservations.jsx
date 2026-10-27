import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/common/StatusBadge';
export const Reservations = () => {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusTab, setStatusTab] = useState('');
    const fetchReservations = async () => {
        try {
            setLoading(true);
            const url = statusTab ? `/reservations?status=${statusTab}` : '/reservations';
            const res = await api.get(url);
            if (res.data.success) {
                setReservations(res.data.data);
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
        fetchReservations();
    }, [statusTab]);
    const handleCancel = async (id) => {
        if (!confirm('Cancel this reservation? If copy is ready, it will be held for next person or returned to shelf.'))
            return;
        try {
            await api.post(`/reservations/${id}/cancel`, { reason: 'Cancelled by staff' });
            fetchReservations();
        }
        catch (err) {
            alert(err.response?.data?.error?.message || 'Failed to cancel');
        }
    };
    return (<div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#1A2238]">Book Reservations</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage reservation queues for books currently on loan
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white rounded-2xl border border-gray-100 shadow-sm w-fit">
        {[
            { id: '', label: 'All' },
            { id: 'pending', label: 'Pending in Queue' },
            { id: 'ready', label: 'Ready for Pickup' },
            { id: 'fulfilled', label: 'Fulfilled' },
            { id: 'cancelled', label: 'Cancelled / Expired' }
        ].map((tab) => (<button key={tab.id} onClick={() => setStatusTab(tab.id)} className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${statusTab === tab.id
                ? 'bg-[#1E3A5F] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'}`}>
            {tab.label}
          </button>))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase font-semibold">
            <tr>
              <th className="py-3 px-4">Book Title</th>
              <th className="py-3 px-4">Reserved By</th>
              <th className="py-3 px-4">Requested On</th>
              <th className="py-3 px-4">Hold Status / Expiry</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (<tr>
                <td colSpan={6} className="py-8 text-center text-gray-400">
                  Loading reservations...
                </td>
              </tr>) : reservations.length === 0 ? (<tr>
                <td colSpan={6} className="py-8 text-center text-gray-400">
                  No reservations found.
                </td>
              </tr>) : (reservations.map((r) => (<tr key={r.id} className="hover:bg-gray-50/50">
                  <td className="py-3 px-4 font-semibold text-gray-800">
                    {r.book?.title}
                    <div className="text-[11px] text-gray-400 font-mono">
                      ISBN: {r.book?.isbn}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-gray-700">{r.member?.name}</div>
                    <div className="text-[11px] text-gray-400 font-mono">
                      {r.member?.memberId} • {r.member?.phone}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-500">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    {r.status === 'ready' && r.expiresAt ? (<span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Hold until {new Date(r.expiresAt).toLocaleDateString()}
                      </span>) : r.status === 'pending' ? (<span className="text-gray-500">Waiting for return</span>) : ('—')}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={r.status}/>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {['pending', 'ready'].includes(r.status) && (<button onClick={() => handleCancel(r.id)} className="px-3 py-1 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition">
                        Cancel
                      </button>)}
                  </td>
                </tr>)))}
          </tbody>
        </table>
      </div>
    </div>);
};
