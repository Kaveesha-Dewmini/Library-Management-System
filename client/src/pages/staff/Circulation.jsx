import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Repeat, ArrowDownLeft, Search, CheckCircle2, XCircle, AlertCircle, Calendar, Sparkles } from 'lucide-react';
import { GeneratedCover } from '../../components/common/GeneratedCover';
import { DueChip } from '../../components/common/DueChip';
export const Circulation = () => {
    const [activeTab, setActiveTab] = useState('issue');
    // Issue State
    const [memberQuery, setMemberQuery] = useState('');
    const [bookQuery, setBookQuery] = useState('');
    const [selectedMember, setSelectedMember] = useState(null);
    const [selectedBook, setSelectedBook] = useState(null);
    const [eligibility, setEligibility] = useState(null);
    const [issueLoading, setIssueLoading] = useState(false);
    const [issueSuccess, setIssueSuccess] = useState(null);
    const [issueError, setIssueError] = useState(null);
    // Return State
    const [returnSearch, setReturnSearch] = useState('');
    const [activeLoans, setActiveLoans] = useState([]);
    const [returnResult, setReturnResult] = useState(null);
    const [returnLoading, setReturnLoading] = useState(false);
    // Search Members
    const searchMember = async () => {
        if (!memberQuery.trim())
            return;
        try {
            setIssueError(null);
            const res = await api.get(`/members?q=${encodeURIComponent(memberQuery.trim())}`);
            if (res.data.data.length > 0) {
                const mem = res.data.data[0];
                setSelectedMember(mem);
                // Check eligibility
                const eligRes = await api.get(`/members/${mem.id}/eligibility`);
                setEligibility(eligRes.data.data);
            }
            else {
                setIssueError('No member found matching query');
                setSelectedMember(null);
                setEligibility(null);
            }
        }
        catch (err) {
            setIssueError('Failed to search member');
        }
    };
    // Search Books
    const searchBook = async () => {
        if (!bookQuery.trim())
            return;
        try {
            setIssueError(null);
            const res = await api.get(`/books?q=${encodeURIComponent(bookQuery.trim())}`);
            if (res.data.data.length > 0) {
                setSelectedBook(res.data.data[0]);
            }
            else {
                setIssueError('No book found matching query');
                setSelectedBook(null);
            }
        }
        catch (err) {
            setIssueError('Failed to search book');
        }
    };
    // Confirm Issue
    const handleConfirmIssue = async () => {
        if (!selectedMember || !selectedBook)
            return;
        setIssueLoading(true);
        setIssueError(null);
        setIssueSuccess(null);
        try {
            const res = await api.post('/loans', {
                memberId: selectedMember.id,
                bookId: selectedBook.id
            });
            setIssueSuccess(`Successfully issued "${selectedBook.title}" to ${selectedMember.name}. Due on ${new Date(res.data.data.dueAt).toLocaleDateString()}`);
            setSelectedMember(null);
            setSelectedBook(null);
            setEligibility(null);
            setMemberQuery('');
            setBookQuery('');
        }
        catch (err) {
            setIssueError(err.response?.data?.error?.message || 'Failed to issue book');
        }
        finally {
            setIssueLoading(false);
        }
    };
    // Fetch active loans for return desk
    const fetchReturnLoans = async (q) => {
        try {
            const url = q ? `/loans?status=active&q=${encodeURIComponent(q)}` : '/loans?status=active';
            const res = await api.get(url);
            setActiveLoans(res.data.data);
        }
        catch (err) {
            console.error(err);
        }
    };
    useEffect(() => {
        if (activeTab === 'return') {
            fetchReturnLoans();
        }
    }, [activeTab]);
    const handleReturnLoan = async (loanId) => {
        setReturnLoading(true);
        setReturnResult(null);
        try {
            const res = await api.post(`/loans/${loanId}/return`);
            setReturnResult(res.data.data);
            fetchReturnLoans(returnSearch);
        }
        catch (err) {
            alert(err.response?.data?.error?.message || 'Failed to process return');
        }
        finally {
            setReturnLoading(false);
        }
    };
    return (<div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#1A2238]">Circulation Desk</h1>
          <p className="text-sm text-gray-500 mt-1">
            Check-out books to members and process book returns
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex p-1 bg-white rounded-xl border border-gray-200 shadow-sm">
          <button onClick={() => setActiveTab('issue')} className={`flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg transition ${activeTab === 'issue'
            ? 'bg-[#1E3A5F] text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-900'}`}>
            <Repeat className="w-4 h-4"/>
            Issue Book
          </button>
          <button onClick={() => setActiveTab('return')} className={`flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg transition ${activeTab === 'return'
            ? 'bg-[#1E3A5F] text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-900'}`}>
            <ArrowDownLeft className="w-4 h-4"/>
            Return Book
          </button>
        </div>
      </div>

      {/* ISSUE TAB */}
      {activeTab === 'issue' && (<div className="space-y-6">
          {issueSuccess && (<div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0"/>
              <span>{issueSuccess}</span>
            </div>)}

          {issueError && (<div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0"/>
              <span>{issueError}</span>
            </div>)}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Step 1: Member Selection */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#1E3A5F] uppercase tracking-wider">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-[#1E3A5F] flex items-center justify-center text-xs font-bold">
                  1
                </span>
                Find Member
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400"/>
                  <input type="text" value={memberQuery} onChange={(e) => setMemberQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && searchMember()} placeholder="Search name, LIB-00001, or email..." className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
                </div>
                <button type="button" onClick={searchMember} className="px-4 py-2 bg-[#1E3A5F] text-white text-sm font-medium rounded-xl hover:bg-[#162C47] transition">
                  Find
                </button>
              </div>

              {selectedMember && (<div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900">{selectedMember.name}</h4>
                    <span className="font-mono text-xs px-2 py-0.5 bg-blue-100 text-[#1E3A5F] rounded-md font-bold">
                      {selectedMember.memberId}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>{selectedMember.email} • {selectedMember.phone}</div>
                    <div className="flex gap-4 pt-1 font-medium">
                      <span>Loans: {selectedMember.activeLoansCount}</span>
                      <span>Owed: LKR {selectedMember.unpaidFinesTotal}</span>
                      <span className="capitalize text-emerald-700 font-bold">✓ {selectedMember.status}</span>
                    </div>
                  </div>
                </div>)}
            </div>

            {/* Step 2: Book Selection */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#1E3A5F] uppercase tracking-wider">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-[#1E3A5F] flex items-center justify-center text-xs font-bold">
                  2
                </span>
                Find Book
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400"/>
                  <input type="text" value={bookQuery} onChange={(e) => setBookQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && searchBook()} placeholder="Search title, ISBN, or author..." className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
                </div>
                <button type="button" onClick={searchBook} className="px-4 py-2 bg-[#1E3A5F] text-white text-sm font-medium rounded-xl hover:bg-[#162C47] transition">
                  Find
                </button>
              </div>

              {selectedBook && (<div className="p-4 rounded-xl bg-amber-50/60 border border-amber-100 flex gap-4 items-center">
                  <GeneratedCover title={selectedBook.title} authors={selectedBook.authors} coverUrl={selectedBook.coverUrl} className="w-14 h-20 shrink-0"/>
                  <div className="text-xs space-y-1">
                    <h4 className="font-semibold text-gray-900 text-sm line-clamp-1">{selectedBook.title}</h4>
                    <p className="text-gray-600 line-clamp-1">{selectedBook.authors?.join(', ')}</p>
                    <div className="flex items-center gap-3 pt-1">
                      <span className="font-mono text-gray-500">Shelf: {selectedBook.shelfLocation}</span>
                      <span className={`font-semibold ${selectedBook.availableCopies > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        ● {selectedBook.availableCopies} of {selectedBook.totalCopies} available
                      </span>
                    </div>
                  </div>
                </div>)}
            </div>
          </div>

          {/* Step 3: Rules Verification Checklist & Issue Confirmation */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-lg text-[#1A2238] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#E09F3E]"/>
              System Rule Verification
            </h3>

            {(!selectedMember || !selectedBook) ? (<p className="text-sm text-gray-400 italic">
                Select both a member and a book above to evaluate borrowing eligibility.
              </p>) : (<div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2 text-xs p-2.5 rounded-xl border border-gray-100">
                    {selectedMember.status === 'active' ? (<CheckCircle2 className="w-4 h-4 text-emerald-600"/>) : (<XCircle className="w-4 h-4 text-rose-600"/>)}
                    <span>Active Member Status</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs p-2.5 rounded-xl border border-gray-100">
                    {eligibility?.stats?.activeLoansCount < eligibility?.stats?.maxLoans ? (<CheckCircle2 className="w-4 h-4 text-emerald-600"/>) : (<XCircle className="w-4 h-4 text-rose-600"/>)}
                    <span>
                      Loan Limit ({eligibility?.stats?.activeLoansCount || 0}/{eligibility?.stats?.maxLoans || 5})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs p-2.5 rounded-xl border border-gray-100">
                    {eligibility?.stats?.overdueLoansCount === 0 ? (<CheckCircle2 className="w-4 h-4 text-emerald-600"/>) : (<XCircle className="w-4 h-4 text-rose-600"/>)}
                    <span>No Overdue Books</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs p-2.5 rounded-xl border border-gray-100">
                    {eligibility?.stats?.unpaidFinesTotal <= eligibility?.stats?.fineLimit ? (<CheckCircle2 className="w-4 h-4 text-emerald-600"/>) : (<XCircle className="w-4 h-4 text-rose-600"/>)}
                    <span>Fines within Limit</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs p-2.5 rounded-xl border border-gray-100">
                    {selectedBook.availableCopies > 0 ? (<CheckCircle2 className="w-4 h-4 text-emerald-600"/>) : (<XCircle className="w-4 h-4 text-rose-600"/>)}
                    <span>Copy Available</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs p-2.5 rounded-xl border border-gray-100">
                    <Calendar className="w-4 h-4 text-[#1E3A5F]"/>
                    <span>Loan Duration: 14 Days</span>
                  </div>
                </div>

                {eligibility?.reasons && eligibility.reasons.length > 0 && (<div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                    <strong>Rule Check Failed:</strong> {eligibility.reasons.join(' • ')}
                  </div>)}

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    Due Date will be set to{' '}
                    <span className="font-semibold text-gray-800">
                      {new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()} (23:59:59)
                    </span>
                  </div>

                  <button type="button" disabled={issueLoading ||
                    !eligibility?.canBorrow ||
                    selectedBook.availableCopies <= 0} onClick={handleConfirmIssue} className="px-6 py-2.5 bg-[#1E3A5F] hover:bg-[#162C47] text-white text-sm font-semibold rounded-xl transition shadow-sm disabled:opacity-40">
                    {issueLoading ? 'Processing Issue...' : 'Confirm Issue'}
                  </button>
                </div>
              </div>)}
          </div>
        </div>)}

      {/* RETURN TAB */}
      {activeTab === 'return' && (<div className="space-y-6">
          {returnResult && (<div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600"/>
                Book returned successfully!
              </div>
              {returnResult.fine && (<div className="text-xs text-rose-700 font-medium">
                  Late return recorded. Late fine generated: LKR {returnResult.fine.amount} ({returnResult.fine.daysLate} days overdue).
                </div>)}
              {returnResult.nextReservation && (<div className="p-3 bg-amber-100 border border-amber-300 rounded-xl text-xs text-amber-900 font-semibold">
                  📌 RESERVATION ALERT: Hold this returned copy for{' '}
                  <span className="underline">{returnResult.nextReservation.member?.name}</span> (Reservation #{returnResult.nextReservation.reservationId}) until{' '}
                  {new Date(returnResult.nextReservation.expiresAt).toLocaleDateString()}.
                </div>)}
            </div>)}

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
              <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400"/>
                <input type="text" value={returnSearch} onChange={(e) => {
                setReturnSearch(e.target.value);
                fetchReturnLoans(e.target.value);
            }} placeholder="Filter active loans by title, member, or ISBN..." className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
              </div>
              <span className="text-xs text-gray-500">{activeLoans.length} active loans found</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Book</th>
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Issued On</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activeLoans.length === 0 ? (<tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-gray-400">
                        No active loans found matching query.
                      </td>
                    </tr>) : (activeLoans.map((loan) => (<tr key={loan.id} className="hover:bg-gray-50/50 transition">
                        <td className="py-3 px-4 font-semibold text-gray-800">
                          {loan.book?.title}
                          <div className="text-xs text-gray-400 font-mono font-normal">
                            ISBN: {loan.book?.isbn}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-700">{loan.member?.name}</div>
                          <div className="text-xs text-gray-400 font-mono">
                            {loan.member?.memberId}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-500">
                          {new Date(loan.issuedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <DueChip dueAt={loan.dueAt} status={loan.status}/>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button type="button" disabled={returnLoading} onClick={() => handleReturnLoan(loan.id)} className="px-4 py-1.5 bg-[#1E3A5F] hover:bg-[#162C47] text-white text-xs font-medium rounded-xl transition shadow-sm">
                            Return
                          </button>
                        </td>
                      </tr>)))}
                </tbody>
              </table>
            </div>
          </div>
        </div>)}
    </div>);
};
