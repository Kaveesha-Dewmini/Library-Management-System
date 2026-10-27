import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { BarChart3, Award, AlertTriangle, BookCheck } from 'lucide-react';
export const Reports = () => {
    const [activeTab, setActiveTab] = useState('popular');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const fetchReport = async () => {
        setLoading(true);
        try {
            if (activeTab === 'popular') {
                const res = await api.get('/reports/popular-books');
                setData(res.data.data);
            }
            else if (activeTab === 'members') {
                const res = await api.get('/reports/active-members');
                setData(res.data.data);
            }
            else if (activeTab === 'overdue') {
                const res = await api.get('/reports/overdue');
                setData(res.data.data);
            }
            else if (activeTab === 'fines') {
                const res = await api.get('/reports/fines-by-month');
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
        fetchReport();
    }, [activeTab]);
    return (<div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#1A2238]">Analytics & Reports</h1>
          <p className="text-sm text-gray-500 mt-1">
            Data insights, popular circulation titles, overdue items, and fine recovery
          </p>
        </div>
      </div>

      {/* Report Segmented Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1 bg-white rounded-2xl border border-gray-100 shadow-sm w-fit">
        {[
            { id: 'popular', label: 'Most Borrowed Books', icon: Award },
            { id: 'members', label: 'Most Active Members', icon: BookCheck },
            { id: 'overdue', label: 'Overdue Audit', icon: AlertTriangle },
            { id: 'fines', label: 'Fines by Month', icon: BarChart3 }
        ].map((tab) => {
            const Icon = tab.icon;
            return (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition ${activeTab === tab.id
                    ? 'bg-[#1E3A5F] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'}`}>
              <Icon className="w-3.5 h-3.5"/>
              {tab.label}
            </button>);
        })}
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        {loading ? (<div className="py-12 text-center text-xs text-gray-400">Loading report data...</div>) : activeTab === 'popular' ? (<div className="space-y-6">
            <h3 className="font-serif font-bold text-lg text-gray-900">Top Circulated Books</h3>
            <div className="space-y-3">
              {data.map((book, idx) => {
                const maxLoans = data[0]?.timesBorrowed || 1;
                const pct = Math.max(8, (book.timesBorrowed / maxLoans) * 100);
                return (<div key={book.id} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-gray-800">
                        {idx + 1}. {book.title}{' '}
                        <span className="text-gray-400 font-normal">by {book.authors?.join(', ')}</span>
                      </span>
                      <span className="font-bold text-[#1E3A5F]">{book.timesBorrowed} loans</span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div style={{ width: `${pct}%` }} className="h-full bg-[#1E3A5F] rounded-full transition-all"></div>
                    </div>
                  </div>);
            })}
            </div>
          </div>) : activeTab === 'members' ? (<div className="space-y-4">
            <h3 className="font-serif font-bold text-lg text-gray-900">Patron Borrowing Activity</h3>
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-100 uppercase text-gray-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Member Name</th>
                  <th className="py-3 px-4">Member ID</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4 text-right">Lifetime Checkouts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((m, idx) => (<tr key={m.id || idx} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-bold text-gray-500">#{idx + 1}</td>
                    <td className="py-3 px-4 font-semibold text-gray-800">{m.name}</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#1E3A5F]">{m.memberId}</td>
                    <td className="py-3 px-4 text-gray-600">{m.email}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700">
                      {m.totalLoans} loans
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>) : activeTab === 'overdue' ? (<div className="space-y-4">
            <h3 className="font-serif font-bold text-lg text-gray-900">Current Overdue Items</h3>
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-100 uppercase text-gray-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">Book Title</th>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Days Overdue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((l) => (<tr key={l.id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-semibold text-gray-800">{l.book?.title}</td>
                    <td className="py-3 px-4">
                      {l.member?.name} ({l.member?.memberId})
                    </td>
                    <td className="py-3 px-4 font-mono">{l.member?.phone || '—'}</td>
                    <td className="py-3 px-4 text-gray-500">
                      {new Date(l.dueAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-rose-600">
                      {l.daysOverdue} days late
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>) : (<div className="space-y-4">
            <h3 className="font-serif font-bold text-lg text-gray-900">Fine Revenue & Waivers by Month</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {data.map((item, idx) => (<div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-center">
                  <div className="font-bold text-xs text-gray-600 mb-1">{item.month}</div>
                  <div className="text-emerald-700 font-semibold text-xs">Paid: LKR {item.paid}</div>
                  <div className="text-rose-600 text-[11px]">Unpaid: LKR {item.unpaid}</div>
                  <div className="text-gray-400 text-[10px]">Waived: LKR {item.waived}</div>
                </div>))}
            </div>
          </div>)}
      </div>
    </div>);
};
