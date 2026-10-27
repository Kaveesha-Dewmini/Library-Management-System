import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Sparkles } from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
export const MyReservations = () => {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const fetchReservations = async () => {
        try {
            setLoading(true);
            const res = await api.get('/reservations/mine');
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
    }, []);
    const handleCancel = async (id) => {
        if (!confirm('Are you sure you want to cancel this reservation?'))
            return;
        try {
            await api.post(`/reservations/${id}/cancel`, { reason: 'Cancelled by member' });
            fetchReservations();
        }
        catch (err) {
            alert(err.response?.data?.error?.message || 'Failed to cancel reservation');
        }
    };
    return (<div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-[#1A2238]">My Book Reservations</h1>
        <p className="text-sm text-gray-500 mt-1">
          Monitor your place in line for popular borrowed books
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase font-semibold">
            <tr>
              <th className="py-3 px-4">Book Title</th>
              <th className="py-3 px-4">Date Placed</th>
              <th className="py-3 px-4">Queue Position</th>
              <th className="py-3 px-4">Pickup Status</th>
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
                  You have no active reservations.
                </td>
              </tr>) : (reservations.map((r) => (<tr key={r.id} className="hover:bg-gray-50/50">
                  <td className="py-3 px-4 font-semibold text-gray-800">
                    {r.book?.title}
                    <div className="text-[11px] text-gray-400 font-normal">
                      by {r.book?.authors?.join(', ')}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-500">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    {r.status === 'pending' ? (<span className="font-semibold text-[#1E3A5F]">
                        #{r.queuePosition} in line
                      </span>) : r.status === 'ready' ? (<span className="font-semibold text-amber-700 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500"/>
                        Next! Book is waiting
                      </span>) : ('—')}
                  </td>
                  <td className="py-3 px-4">
                    {r.status === 'ready' && r.expiresAt ? (<span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-semibold text-[11px]">
                        Pick up before {new Date(r.expiresAt).toLocaleDateString()}
                      </span>) : (<span className="text-gray-400">Waiting for copy return</span>)}
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
