import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, ArrowRight, BookmarkCheck } from 'lucide-react';
import { DueChip } from '../../components/common/DueChip';
import { GeneratedCover } from '../../components/common/GeneratedCover';
export const MemberHome = () => {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const fetchMemberHome = async () => {
        try {
            setLoading(true);
            const res = await api.get('/dashboard/member');
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
        fetchMemberHome();
    }, []);
    const handleRenew = async (loanId) => {
        try {
            await api.post(`/loans/${loanId}/renew`);
            alert('Loan renewed successfully for another 14 days!');
            fetchMemberHome();
        }
        catch (err) {
            alert(err.response?.data?.error?.message || 'Failed to renew book');
        }
    };
    if (loading) {
        return <div className="p-8 text-center text-xs text-gray-400">Loading your library dashboard...</div>;
    }
    const currentLoans = data?.currentLoans || [];
    const reservations = data?.reservations || [];
    const newArrivals = data?.newArrivals || [];
    return (<div className="space-y-8">
      {/* Greeting Banner */}
      <div>
        <h1 className="font-serif text-3xl font-bold text-[#1A2238]">
          Hi {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          You currently have{' '}
          <strong className="text-gray-800">{currentLoans.length} books</strong> checked out in your possession.
        </p>
      </div>

      {/* 3 Core Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Books with You */}
        <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="font-serif font-bold text-sm text-[#1A2238] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#1E3A5F]"/>
                Current Loans ({currentLoans.length})
              </span>
              <Link to="/my-loans" className="text-xs text-[#1E3A5F] hover:underline">
                View all
              </Link>
            </div>

            <div className="space-y-3 mt-3">
              {currentLoans.length === 0 ? (<p className="text-xs text-gray-400 py-3">No books currently borrowed.</p>) : (currentLoans.slice(0, 2).map((l) => (<div key={l.id} className="p-2.5 bg-gray-50 rounded-xl space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-xs text-gray-800 line-clamp-1">
                        {l.book?.title}
                      </span>
                      <DueChip dueAt={l.dueAt} status={l.status}/>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-gray-400">Renewals: {l.renewals}/2</span>
                      <button onClick={() => handleRenew(l.id)} className="text-xs font-semibold text-[#1E3A5F] hover:underline">
                        Renew
                      </button>
                    </div>
                  </div>)))}
            </div>
          </div>
        </div>

        {/* Card 2: Reservations */}
        <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="font-serif font-bold text-sm text-[#1A2238] flex items-center gap-2">
                <BookmarkCheck className="w-4 h-4 text-[#E09F3E]"/>
                Reservations ({reservations.length})
              </span>
              <Link to="/my-reservations" className="text-xs text-[#1E3A5F] hover:underline">
                View queue
              </Link>
            </div>

            <div className="space-y-3 mt-3">
              {reservations.length === 0 ? (<p className="text-xs text-gray-400 py-3">No active reservations.</p>) : (reservations.map((r) => (<div key={r.id} className="p-2.5 bg-gray-50 rounded-xl space-y-1">
                    <div className="font-semibold text-xs text-gray-800 line-clamp-1">
                      {r.book?.title}
                    </div>
                    {r.status === 'ready' ? (<div className="text-xs text-amber-800 font-semibold bg-amber-100 px-2 py-1 rounded-lg">
                        🎉 Ready for pickup at the front desk!
                      </div>) : (<div className="text-[11px] text-gray-500">
                        Queue Position: #{r.queuePosition} in line
                      </div>)}
                  </div>)))}
            </div>
          </div>
        </div>

        {/* Card 3: Fines */}
        <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="font-serif font-bold text-sm text-[#1A2238]">Fines & Penalties</span>
              <Link to="/my-fines" className="text-xs text-[#1E3A5F] hover:underline">
                Details
              </Link>
            </div>

            <div className="my-4">
              {data?.unpaidFinesTotal > 0 ? (<div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
                  <div className="font-bold text-base font-serif">
                    {data.currency} {data.unpaidFinesTotal} Unpaid
                  </div>
                  <p className="mt-1 text-[11px]">Please settle at the library desk to keep borrowing privileges.</p>
                </div>) : (<div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs">
                  <div className="font-bold text-sm">All Clear ✓</div>
                  <p className="mt-0.5 text-[11px]">No unpaid fines on record.</p>
                </div>)}
            </div>
          </div>

          <Link to="/catalogue" className="text-xs font-semibold text-[#1E3A5F] hover:underline flex items-center justify-center gap-1 pt-2">
            Explore Catalogue <ArrowRight className="w-3.5 h-3.5"/>
          </Link>
        </div>
      </div>

      {/* New Arrivals Carousel / Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-bold text-xl text-[#1A2238]">New Arrivals</h3>
          <Link to="/catalogue" className="text-xs font-semibold text-[#1E3A5F] hover:underline">
            View full catalogue →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {newArrivals.map((b) => (<Link key={b.id} to="/catalogue" className="bg-white p-2.5 rounded-2xl border border-gray-100 book-card-shadow flex flex-col justify-between group">
              <GeneratedCover title={b.title} authors={b.authors} coverUrl={b.coverUrl} color={b.categories?.[0]?.color || '#1E3A5F'} className="w-full h-36 mb-2"/>
              <div className="text-xs font-serif font-bold text-gray-800 line-clamp-1 group-hover:text-[#1E3A5F]">
                {b.title}
              </div>
              <div className="text-[10px] text-gray-400 line-clamp-1">{b.authors?.join(', ')}</div>
            </Link>))}
        </div>
      </div>
    </div>);
};
