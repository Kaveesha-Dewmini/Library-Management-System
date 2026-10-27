import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Search } from 'lucide-react';
import { DueChip } from '../../components/common/DueChip';
import { StatusBadge } from '../../components/common/StatusBadge';
export const Loans = () => {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusTab, setStatusTab] = useState('');
    const [search, setSearch] = useState('');
    const fetchLoans = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (statusTab === 'dueSoon') {
                params.append('dueSoon', 'true');
            }
            else if (statusTab) {
                params.append('status', statusTab);
            }
            if (search)
                params.append('q', search);
            const res = await api.get(`/loans?${params.toString()}`);
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
    }, [statusTab, search]);
    return (<div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#1A2238]">Loans Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track active loans, due dates, renewal counts, and return statuses
          </p>
        </div>
      </div>

      {/* Tabs and Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
        {/* Segmented Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-gray-100 rounded-xl w-full md:w-auto">
          {[
            { id: '', label: 'All Loans' },
            { id: 'active', label: 'Active' },
            { id: 'overdue', label: 'Overdue' },
            { id: 'dueSoon', label: 'Due This Week' },
            { id: 'returned', label: 'Returned' }
        ].map((tab) => (<button key={tab.id} onClick={() => setStatusTab(tab.id)} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${statusTab === tab.id
                ? 'bg-white text-[#1E3A5F] shadow-xs'
                : 'text-gray-600 hover:text-gray-900'}`}>
              {tab.label}
            </button>))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400"/>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search member, title, or ISBN..." className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
        </div>
      </div>

      {/* Loans Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase font-semibold">
            <tr>
              <th className="py-3 px-4">Book Title</th>
              <th className="py-3 px-4">Member</th>
              <th className="py-3 px-4">Issued On</th>
              <th className="py-3 px-4">Due Date</th>
              <th className="py-3 px-4">Renewals</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (<tr>
                <td colSpan={6} className="py-8 text-center text-gray-400">
                  Loading loans...
                </td>
              </tr>) : loans.length === 0 ? (<tr>
                <td colSpan={6} className="py-8 text-center text-gray-400">
                  No loans matching this filter.
                </td>
              </tr>) : (loans.map((loan) => (<tr key={loan.id} className={`hover:bg-gray-50/50 ${loan.status === 'overdue' ? 'bg-rose-50/30' : ''}`}>
                  <td className="py-3 px-4 font-semibold text-gray-800">
                    {loan.book?.title}
                    <div className="text-[11px] font-mono text-gray-400">
                      Shelf: {loan.book?.shelfLocation} • ISBN: {loan.book?.isbn}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-gray-700">{loan.member?.name}</div>
                    <div className="text-[11px] text-gray-400 font-mono">
                      {loan.member?.memberId} • {loan.member?.phone}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-500">
                    {new Date(loan.issuedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <DueChip dueAt={loan.dueAt} status={loan.status}/>
                  </td>
                  <td className="py-3 px-4 font-semibold text-gray-600">
                    {loan.renewals} / 2
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={loan.status}/>
                  </td>
                </tr>)))}
          </tbody>
        </table>
      </div>
    </div>);
};
