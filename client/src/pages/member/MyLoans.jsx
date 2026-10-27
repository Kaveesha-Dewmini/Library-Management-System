import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { RefreshCw } from 'lucide-react';
import { DueChip } from '../../components/common/DueChip';
import { StatusBadge } from '../../components/common/StatusBadge';
export const MyLoans = () => {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const fetchLoans = async () => {
        try {
            setLoading(true);
            const res = await api.get('/loans/mine');
            if (res.data.success) {
                setLoans(res.data.data);
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
        fetchLoans();
    }, []);
    const handleRenew = async (loanId) => {
        try {
            await api.post(`/loans/${loanId}/renew`);
            alert('Loan renewed successfully for 14 more days!');
            fetchLoans();
        }
        catch (err) {
            alert(err.response?.data?.error?.message || 'Could not renew loan.');
        }
    };
    return (<div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-[#1A2238]">My Borrowed Books</h1>
        <p className="text-sm text-gray-500 mt-1">
          Keep track of your due dates and request loan renewals
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase font-semibold">
            <tr>
              <th className="py-3 px-4">Book Title</th>
              <th className="py-3 px-4">Shelf Location</th>
              <th className="py-3 px-4">Issued On</th>
              <th className="py-3 px-4">Due Date</th>
              <th className="py-3 px-4">Renewals Used</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (<tr>
                <td colSpan={7} className="py-8 text-center text-gray-400">
                  Loading loans...
                </td>
              </tr>) : loans.length === 0 ? (<tr>
                <td colSpan={7} className="py-8 text-center text-gray-400">
                  You have no books currently on loan.
                </td>
              </tr>) : (loans.map((l) => (<tr key={l.id} className="hover:bg-gray-50/50">
                  <td className="py-3 px-4 font-semibold text-gray-800">
                    {l.book?.title}
                    <div className="text-[11px] text-gray-400 font-normal">
                      by {l.book?.authors?.join(', ')}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-gray-600">
                    {l.book?.shelfLocation}
                  </td>
                  <td className="py-3 px-4 text-gray-500">
                    {new Date(l.issuedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <DueChip dueAt={l.dueAt} status={l.status}/>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-600">
                    {l.renewals} / 2
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={l.status}/>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {l.status === 'active' && l.renewals < 2 && (<button onClick={() => handleRenew(l.id)} className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1E3A5F] hover:bg-[#162C47] text-white rounded-lg transition">
                        <RefreshCw className="w-3 h-3"/>
                        Renew
                      </button>)}
                  </td>
                </tr>)))}
          </tbody>
        </table>
      </div>
    </div>);
};
