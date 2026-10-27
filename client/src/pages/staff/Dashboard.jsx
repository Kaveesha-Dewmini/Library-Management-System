import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/common/StatCard';
import { DueChip } from '../../components/common/DueChip';
import { BookCopy, Users, Repeat, AlertTriangle, CircleDollarSign, PlusCircle, Calendar, Clock, Activity } from 'lucide-react';
export const Dashboard = () => {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const fetchStats = async () => {
        try {
            setLoading(true);
            const res = await api.get('/dashboard/stats');
            if (res.data.success) {
                setData(res.data.data);
            }
        }
        catch (err) {
            console.error('Error fetching dashboard stats:', err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchStats();
    }, []);
    if (loading) {
        return (<div className="space-y-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded-xl w-1/3"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (<div key={i} className="h-28 bg-gray-200 rounded-2xl"></div>))}
        </div>
      </div>);
    }
    const stats = data?.stats || {};
    return (<div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#1A2238]">
            Good day, {user?.name}
          </h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400"/>
            {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })}
          </p>
        </div>

        <Link to="/circulation" className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#E09F3E] hover:bg-[#C88B32] text-white text-sm font-semibold rounded-xl transition shadow-sm">
          <PlusCircle className="w-4 h-4"/>
          Issue Book
        </Link>
      </div>

      {/* 5 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Copies" value={stats.totalCopies || 0} icon={BookCopy} subtext={`${stats.totalTitles || 0} unique titles`} color="blue"/>
        <StatCard label="Active Members" value={stats.activeMembers || 0} icon={Users} subtext="Registered patrons" color="green"/>
        <StatCard label="Books on Loan" value={stats.booksOnLoan || 0} icon={Repeat} subtext="Currently circulating" color="blue"/>
        <StatCard label="Overdue Loans" value={stats.overdueLoans || 0} icon={AlertTriangle} subtext="Action needed" color="red"/>
        <StatCard label="Unpaid Fines" value={`${stats.currency} ${stats.unpaidFines || 0}`} icon={CircleDollarSign} subtext="Outstanding penalties" color="amber"/>
      </div>

      {/* Charts Section: 30-Day Activity & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Trend (30 Days) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#1A2238]">Circulation Activity</h3>
              <p className="text-xs text-gray-500">Loans and returns over the past 30 days</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-[#1E3A5F]">
                <span className="w-3 h-3 rounded-full bg-[#1E3A5F]"></span> Loans
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Returns
              </span>
            </div>
          </div>

          <div className="h-56 flex items-end gap-1.5 pt-6 border-b border-gray-100">
            {(data?.loansTrend || []).slice(-20).map((item, i) => {
            const maxVal = Math.max(...data.loansTrend.map((t) => Math.max(t.loans, t.returns, 5)));
            const loanHeight = Math.max(8, (item.loans / maxVal) * 160);
            const returnHeight = Math.max(8, (item.returns / maxVal) * 160);
            return (<div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="w-full flex items-end justify-center gap-0.5">
                    <div style={{ height: `${loanHeight}px` }} className="w-1/2 bg-[#1E3A5F] rounded-t transition-all group-hover:bg-[#E09F3E]" title={`Loans: ${item.loans}`}></div>
                    <div style={{ height: `${returnHeight}px` }} className="w-1/2 bg-emerald-500 rounded-t transition-all group-hover:bg-emerald-600" title={`Returns: ${item.returns}`}></div>
                  </div>
                  <span className="text-[10px] text-gray-400 rotate-45 origin-left hidden md:block">
                    {item.date.slice(8)}
                  </span>
                </div>);
        })}
          </div>
        </div>

        {/* Categories Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#1A2238]">Loans by Category</h3>
            <p className="text-xs text-gray-500 mb-4">Most popular reading genres</p>

            <div className="space-y-3">
              {(data?.categoryDistribution || []).map((cat, idx) => (<div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-gray-700">{cat.name}</span>
                    <span className="text-gray-500">{cat.count} loans</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div style={{
                width: `${Math.min(100, (cat.count / (stats.booksOnLoan || 10)) * 100)}%`,
                backgroundColor: cat.color
            }} className="h-full rounded-full transition-all"></div>
                  </div>
                </div>))}
            </div>
          </div>

          <Link to="/categories" className="text-xs font-semibold text-[#1E3A5F] hover:underline mt-4 block text-center">
            Manage Categories →
          </Link>
        </div>
      </div>

      {/* Bottom 3 Cards: Due Today, Most Overdue, Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Due Today */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h4 className="font-serif font-bold text-base text-[#1A2238] flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500"/>
              Due Today ({data?.dueToday?.length || 0})
            </h4>
            <Link to="/loans?dueSoon=true" className="text-xs text-[#1E3A5F] hover:underline">
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {(!data?.dueToday || data.dueToday.length === 0) ? (<p className="text-xs text-gray-400 py-4 text-center">No books due today.</p>) : (data.dueToday.map((loan) => (<div key={loan.id} className="flex items-center justify-between text-xs">
                  <div className="truncate pr-2">
                    <div className="font-semibold text-gray-800 truncate">{loan.book?.title}</div>
                    <div className="text-gray-500">{loan.member?.name}</div>
                  </div>
                  <DueChip dueAt={loan.dueAt} status={loan.status}/>
                </div>)))}
          </div>
        </div>

        {/* Most Overdue */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h4 className="font-serif font-bold text-base text-[#1A2238] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500"/>
              Most Overdue
            </h4>
            <Link to="/loans?status=overdue" className="text-xs text-[#1E3A5F] hover:underline">
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {(!data?.mostOverdue || data.mostOverdue.length === 0) ? (<p className="text-xs text-gray-400 py-4 text-center">No overdue books!</p>) : (data.mostOverdue.map((loan) => (<div key={loan.id} className="flex items-center justify-between text-xs">
                  <div className="truncate pr-2">
                    <div className="font-semibold text-gray-800 truncate">{loan.book?.title}</div>
                    <div className="text-gray-500">{loan.member?.name} • {loan.member?.phone}</div>
                  </div>
                  <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    {loan.daysOverdue}d late
                  </span>
                </div>)))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h4 className="font-serif font-bold text-base text-[#1A2238] flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500"/>
              Recent Activity
            </h4>
            <Link to="/audit-logs" className="text-xs text-[#1E3A5F] hover:underline">
              Audit log
            </Link>
          </div>

          <div className="space-y-3">
            {(!data?.recentActivity || data.recentActivity.length === 0) ? (<p className="text-xs text-gray-400 py-4 text-center">No recorded activity yet.</p>) : (data.recentActivity.map((log) => (<div key={log.id} className="text-xs flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1E3A5F] mt-1.5 shrink-0"></div>
                  <div>
                    <span className="font-medium text-gray-800">
                      {log.actor?.name || 'System'}
                    </span>{' '}
                    <span className="text-gray-600">
                      {log.action.replace(/_/g, ' ').toLowerCase()}
                    </span>
                    <div className="text-[10px] text-gray-400">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>)))}
          </div>
        </div>
      </div>
    </div>);
};
