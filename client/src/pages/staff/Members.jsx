import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Search, Plus, UserX, UserCheck, Trash2, Eye, AlertCircle } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
export const Members = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    // Add Member Modal
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        password: 'Member@123'
    });
    const [formError, setFormError] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    // View Member Detail Modal
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const fetchMembers = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (search)
                params.append('q', search);
            if (statusFilter)
                params.append('status', statusFilter);
            const res = await api.get(`/members?${params.toString()}`);
            if (res.data.success) {
                setMembers(res.data.data);
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
        fetchMembers();
    }, [search, statusFilter]);
    const handleOpenAdd = () => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            address: '',
            password: 'Member@123'
        });
        setFormError('');
        setAddModalOpen(true);
    };
    const handleCreateMember = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError('');
        try {
            const res = await api.post('/members', formData);
            alert(`Member created successfully!\nMember ID: ${res.data.data.memberId}\nTemporary Password: ${res.data.data.temporaryPassword}`);
            setAddModalOpen(false);
            fetchMembers();
        }
        catch (err) {
            setFormError(err.response?.data?.error?.message || 'Failed to create member');
        }
        finally {
            setFormLoading(false);
        }
    };
    const handleToggleStatus = async (member) => {
        const newStatus = member.status === 'active' ? 'suspended' : 'active';
        if (!confirm(`Are you sure you want to set ${member.name}'s status to ${newStatus}?`))
            return;
        try {
            await api.patch(`/members/${member.id}`, { status: newStatus });
            fetchMembers();
        }
        catch (err) {
            alert(err.response?.data?.error?.message || 'Failed to update member status');
        }
    };
    const handleDeleteMember = async (member) => {
        if (!confirm(`Are you sure you want to delete member ${member.name}?`))
            return;
        try {
            await api.delete(`/members/${member.id}`);
            fetchMembers();
        }
        catch (err) {
            alert(err.response?.data?.error?.message || 'Failed to delete member');
        }
    };
    const handleViewDetail = async (memberId) => {
        setDetailLoading(true);
        setDetailModalOpen(true);
        try {
            const res = await api.get(`/members/${memberId}`);
            if (res.data.success) {
                setSelectedMember(res.data.data);
            }
        }
        catch (err) {
            console.error(err);
        }
        finally {
            setDetailLoading(false);
        }
    };
    return (<div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#1A2238]">Library Members</h1>
          <p className="text-sm text-gray-500 mt-1">
            Registered patrons, borrowing privileges, and member status
          </p>
        </div>

        <button onClick={handleOpenAdd} className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E3A5F] hover:bg-[#162C47] text-white text-xs font-semibold rounded-xl transition shadow-sm">
          <Plus className="w-4 h-4"/>
          Add Member
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400"/>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, member ID, phone, or email..." className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
        </div>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] w-full sm:w-auto">
          <option value="">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="suspended">Suspended Only</option>
        </select>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase font-semibold">
            <tr>
              <th className="py-3 px-4">Member Name</th>
              <th className="py-3 px-4">Member ID</th>
              <th className="py-3 px-4">Phone</th>
              <th className="py-3 px-4">Active Loans</th>
              <th className="py-3 px-4">Fines Owed</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (<tr>
                <td colSpan={7} className="py-8 text-center text-gray-400">
                  Loading members...
                </td>
              </tr>) : members.length === 0 ? (<tr>
                <td colSpan={7} className="py-8 text-center text-gray-400">
                  No members found.
                </td>
              </tr>) : (members.map((m) => (<tr key={m.id} className="hover:bg-gray-50/50">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-gray-800">{m.name}</div>
                    <div className="text-[11px] text-gray-400">{m.email}</div>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-[#1E3A5F]">{m.memberId}</td>
                  <td className="py-3 px-4 text-gray-600">{m.phone || '—'}</td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-gray-700">{m.activeLoansCount || 0}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`font-semibold ${m.unpaidFinesTotal > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                      LKR {m.unpaidFinesTotal || 0}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={m.status}/>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleViewDetail(m.id)} className="p-1 text-gray-400 hover:text-[#1E3A5F] transition" title="View Profile">
                        <Eye className="w-4 h-4"/>
                      </button>
                      <button onClick={() => handleToggleStatus(m)} className="p-1 text-gray-400 hover:text-amber-600 transition" title={m.status === 'active' ? 'Suspend Member' : 'Reactivate Member'}>
                        {m.status === 'active' ? (<UserX className="w-4 h-4"/>) : (<UserCheck className="w-4 h-4 text-emerald-600"/>)}
                      </button>
                      {isAdmin && (<button onClick={() => handleDeleteMember(m)} className="p-1 text-gray-400 hover:text-rose-600 transition" title="Delete Member">
                          <Trash2 className="w-4 h-4"/>
                        </button>)}
                    </div>
                  </td>
                </tr>)))}
          </tbody>
        </table>
      </div>

      {/* Add Member Modal */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Register New Library Member">
        <form onSubmit={handleCreateMember} className="space-y-4 text-xs">
          {formError && (<div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0"/>
              <span>{formError}</span>
            </div>)}

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Full Name *</label>
            <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Shalini Fernando" className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Email Address *</label>
            <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="shalini@example.com" className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Phone Number</label>
              <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="077 123 4567" className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Initial Password</label>
              <input type="text" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Address / City</label>
            <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Colombo 03" className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button type="button" onClick={() => setAddModalOpen(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition">
              Cancel
            </button>
            <button type="submit" disabled={formLoading} className="px-6 py-2 bg-[#1E3A5F] hover:bg-[#162C47] text-white font-semibold rounded-xl transition shadow-sm disabled:opacity-50">
              {formLoading ? 'Creating...' : 'Register Member'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Member Profile Modal */}
      <Modal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)} title="Member Profile & Loan History" maxWidth="max-w-3xl">
        {detailLoading || !selectedMember ? (<div className="py-8 text-center text-xs text-gray-400">Loading member details...</div>) : (<div className="space-y-6 text-xs">
            {/* Header Card */}
            <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-base text-gray-900">{selectedMember.name}</h3>
                <p className="text-gray-500">{selectedMember.email} • {selectedMember.phone}</p>
                <p className="text-gray-400 text-[11px] mt-0.5">{selectedMember.address}</p>
              </div>
              <div className="text-right">
                <span className="font-mono text-sm px-2.5 py-1 bg-blue-100 text-[#1E3A5F] rounded-lg font-bold">
                  {selectedMember.memberId}
                </span>
                <div className="mt-2">
                  <StatusBadge status={selectedMember.status}/>
                </div>
              </div>
            </div>

            {/* Active Loans */}
            <div>
              <h4 className="font-semibold text-gray-800 uppercase tracking-wider mb-2">
                Current Active Loans ({selectedMember.activeLoans?.length || 0})
              </h4>
              <div className="space-y-2">
                {(!selectedMember.activeLoans || selectedMember.activeLoans.length === 0) ? (<p className="text-gray-400 italic">No books currently checked out.</p>) : (selectedMember.activeLoans.map((l) => (<div key={l.id} className="p-2.5 bg-white border border-gray-100 rounded-xl flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-gray-800">{l.book?.title}</div>
                        <div className="text-[11px] text-gray-400">Shelf: {l.book?.shelfLocation}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] text-gray-500">
                          Due: {new Date(l.dueAt).toLocaleDateString()}
                        </div>
                        <span className={`text-[10px] font-bold ${l.status === 'overdue' ? 'text-rose-600' : 'text-blue-600'}`}>
                          {l.status}
                        </span>
                      </div>
                    </div>)))}
              </div>
            </div>

            {/* Outstanding Fines */}
            <div>
              <h4 className="font-semibold text-gray-800 uppercase tracking-wider mb-2">
                Recorded Fines (Unpaid: LKR {selectedMember.unpaidFinesTotal || 0})
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {(!selectedMember.fines || selectedMember.fines.length === 0) ? (<p className="text-gray-400 italic">No fines recorded.</p>) : (selectedMember.fines.map((f) => (<div key={f.id} className="p-2 bg-white border border-gray-100 rounded-lg flex justify-between items-center text-[11px]">
                      <span>Amount: LKR {f.amount} ({f.daysLate} days late)</span>
                      <StatusBadge status={f.status}/>
                    </div>)))}
              </div>
            </div>
          </div>)}
      </Modal>
    </div>);
};
