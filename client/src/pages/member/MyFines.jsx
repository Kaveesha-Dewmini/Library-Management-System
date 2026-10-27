import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
export const MyFines = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const fetchFines = async () => {
        try {
            setLoading(true);
            const res = await api.get('/fines/mine');
            if (res.data.success) {
                setData(res.data.data);
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
    }, []);
    if (loading) {
        return <div className="p-8 text-center text-xs text-gray-400">Loading fine statements...</div>;
    }
    const summary = data?.summary || {};
    const fines = data?.fines || [];
    const liveEstimates = data?.liveEstimates || [];
    return (<div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-[#1A2238]">My Fines & Fees</h1>
        <p className="text-sm text-gray-500 mt-1">
          Review recorded library fines and live estimates for any overdue books
        </p>
      </div>

      {/* Summary Banner */}
      <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Total Outstanding Balance
          </span>
          <div className="font-serif text-3xl font-bold text-gray-900 mt-1">
            {summary.currency} {summary.totalDue || 0}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Includes recorded unpaid fines + live estimates on current overdue books.
          </p>
        </div>

        {summary.totalDue > 0 ? (<div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600"/>
            <span>Fines can be paid in cash or card at the front circulation desk.</span>
          </div>) : (<div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0"/>
            <span>Your account is in good standing! No balance owed.</span>
          </div>)}
      </div>

      {/* Live Estimated Fines on Currently Overdue Books */}
      {liveEstimates.length > 0 && (<div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 font-semibold text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600"/>
            Accruing Fines on Currently Overdue Books
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {liveEstimates.map((item) => (<div key={item.loanId} className="p-3 bg-white rounded-xl border border-rose-100 text-xs flex justify-between items-center">
                <div>
                  <div className="font-semibold text-gray-800">{item.book?.title}</div>
                  <div className="text-[11px] text-rose-600">{item.daysLate} days late</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-rose-700">~ {summary.currency} {item.estimatedFine}</div>
                  <div className="text-[10px] text-gray-400">estimated</div>
                </div>
              </div>))}
          </div>
        </div>)}

      {/* Recorded Fines History Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 font-serif font-bold text-sm text-[#1A2238]">
          Fines History
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase font-semibold">
            <tr>
              <th className="py-3 px-4">Book</th>
              <th className="py-3 px-4">Date Recorded</th>
              <th className="py-3 px-4">Days Late</th>
              <th className="py-3 px-4">Amount</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {fines.length === 0 ? (<tr>
                <td colSpan={5} className="py-8 text-center text-gray-400">
                  No historical fine records on your account.
                </td>
              </tr>) : (fines.map((f) => (<tr key={f.id} className="hover:bg-gray-50/50">
                  <td className="py-3 px-4 font-semibold text-gray-800">
                    {f.loan?.book?.title || 'Library Item'}
                  </td>
                  <td className="py-3 px-4 text-gray-500">
                    {new Date(f.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-gray-600">{f.daysLate} days late</td>
                  <td className="py-3 px-4 font-bold text-gray-900 font-mono">
                    {summary.currency} {f.amount}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={f.status}/>
                  </td>
                </tr>)))}
          </tbody>
        </table>
      </div>
    </div>);
};
