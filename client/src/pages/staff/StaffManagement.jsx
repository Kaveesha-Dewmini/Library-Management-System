import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Plus, UserCheck, UserX, AlertCircle } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
export const StaffManagement = () => {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'librarian',
        phone: ''
    });
    const [formLoading, setFormLoading] = useState(false);
    const [error, setError] = useState('');
    const fetchStaff = async () => {
        try {
            setLoading(true);
            const res = await api.get('/staff');
            if (res.data.success) {
                setStaff(res.data.data);
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
        fetchStaff();
    }, []);
    const handleOpenAdd = () => {
        setFormData({
            name: '',
            email: '',
            password: '',
            role: 'librarian',
            phone: ''
        });
        setError('');
        setModalOpen(true);
    };
    const handleCreate = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setError('');
        try {
            await api.post('/staff', formData);
            setModalOpen(false);
            fetchStaff();
        }
        catch (err) {
            setError(err.response?.data?.error?.message || 'Failed to create staff account');
        }
        finally {
            setFormLoading(false);
        }
    };
    const handleToggleStatus = async (item) => {
        const newStatus = item.status === 'active' ? 'suspended' : 'active';
        if (!confirm(`Are you sure you want to change ${item.name}'s status to ${newStatus}?`))
            return;
        try {
            await api.patch(`/staff/${item.id}`, { status: newStatus });
            fetchStaff();
        }
        catch (err) {
            alert(err.response?.data?.error?.message || 'Failed to update staff');
        }
    };
    return (<div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#1A2238]">Staff Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage front-desk librarians and system administrator credentials
          </p>
        </div>

        <button onClick={handleOpenAdd} className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E3A5F] hover:bg-[#162C47] text-white text-xs font-semibold rounded-xl transition shadow-sm">
          <Plus className="w-4 h-4"/>
          Add Staff Account
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase font-semibold">
            <tr>
              <th className="py-3 px-4">Staff Name</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Phone</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (<tr>
                <td colSpan={6} className="py-8 text-center text-gray-400">
                  Loading staff accounts...
                </td>
              </tr>) : (staff.map((s) => (<tr key={s.id} className="hover:bg-gray-50/50">
                  <td className="py-3 px-4 font-semibold text-gray-800">{s.name}</td>
                  <td className="py-3 px-4 text-gray-600">{s.email}</td>
                  <td className="py-3 px-4 font-semibold uppercase text-[11px] text-[#1E3A5F]">
                    {s.role}
                  </td>
                  <td className="py-3 px-4 text-gray-500">{s.phone || '—'}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={s.status}/>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => handleToggleStatus(s)} className="p-1 text-gray-400 hover:text-amber-600 transition" title={s.status === 'active' ? 'Disable Account' : 'Enable Account'}>
                      {s.status === 'active' ? (<UserX className="w-4 h-4"/>) : (<UserCheck className="w-4 h-4 text-emerald-600"/>)}
                    </button>
                  </td>
                </tr>)))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Staff Account">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          {error && (<div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0"/>
              <span>{error}</span>
            </div>)}

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Full Name *</label>
            <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Email Address *</label>
            <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Password *</label>
              <input type="password" required minLength={6} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Assigned Role</label>
              <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]">
                <option value="librarian">Librarian</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Phone Number</label>
            <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="077 100 0000" className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition">
              Cancel
            </button>
            <button type="submit" disabled={formLoading} className="px-6 py-2 bg-[#1E3A5F] hover:bg-[#162C47] text-white font-semibold rounded-xl transition shadow-sm disabled:opacity-50">
              {formLoading ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>);
};
