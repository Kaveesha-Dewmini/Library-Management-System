import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Save, CheckCircle2, AlertCircle } from 'lucide-react';
export const Settings = () => {
    const [formData, setFormData] = useState({
        libraryName: 'Shelfwise City Library',
        currency: 'LKR',
        loanPeriod: 14,
        maxLoans: 5,
        maxRenewals: 2,
        finePerDay: 10,
        maxFine: 500,
        fineLimit: 200,
        holdDays: 3
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await api.get('/settings');
            if (res.data.success) {
                setFormData(res.data.data);
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
        fetchSettings();
    }, []);
    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'number' ? Number(value) : value
        });
        setSuccess(false);
    };
    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess(false);
        try {
            await api.patch('/settings', formData);
            setSuccess(true);
        }
        catch (err) {
            setError(err.response?.data?.error?.message || 'Failed to save settings');
        }
        finally {
            setSaving(false);
        }
    };
    if (loading) {
        return <div className="p-8 text-center text-xs text-gray-400">Loading library settings...</div>;
    }
    return (<div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-serif text-3xl font-bold text-[#1A2238]">Library Settings & Rules</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure circulation parameters, borrowing limits, late fine rates, and currency
        </p>
      </div>

      {success && (<div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0"/>
          <span>Library configuration updated successfully! All business rules are now active.</span>
        </div>)}

      {error && (<div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0"/>
          <span>{error}</span>
        </div>)}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: General Library Info */}
        <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-base text-[#1A2238] border-b border-gray-100 pb-2">
            General Library Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Library Name</label>
              <input type="text" name="libraryName" value={formData.libraryName} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Currency Code</label>
              <input type="text" name="currency" value={formData.currency} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
            </div>
          </div>
        </div>

        {/* Card 2: Circulation Rules */}
        <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-base text-[#1A2238] border-b border-gray-100 pb-2">
            Borrowing & Circulation Limits
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Loan Period (Days)
              </label>
              <input type="number" min={1} name="loanPeriod" value={formData.loanPeriod} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
              <span className="text-[10px] text-gray-400 mt-0.5 block">Default: 14 days</span>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Max Active Loans
              </label>
              <input type="number" min={1} name="maxLoans" value={formData.maxLoans} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
              <span className="text-[10px] text-gray-400 mt-0.5 block">Default: 5 books per member</span>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Max Renewals per Loan
              </label>
              <input type="number" min={0} name="maxRenewals" value={formData.maxRenewals} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
              <span className="text-[10px] text-gray-400 mt-0.5 block">Default: 2 renewals</span>
            </div>
          </div>
        </div>

        {/* Card 3: Late Fines & Hold Duration */}
        <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-base text-[#1A2238] border-b border-gray-100 pb-2">
            Fines & Reservation Policies
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Fine Rate per Late Day ({formData.currency})
              </label>
              <input type="number" min={0} name="finePerDay" value={formData.finePerDay} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
              <span className="text-[10px] text-gray-400 mt-0.5 block">Default: 10 LKR</span>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Maximum Fine Cap per Loan ({formData.currency})
              </label>
              <input type="number" min={0} name="maxFine" value={formData.maxFine} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
              <span className="text-[10px] text-gray-400 mt-0.5 block">Default: 500 LKR</span>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Fine Threshold Blocking Loans ({formData.currency})
              </label>
              <input type="number" min={0} name="fineLimit" value={formData.fineLimit} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
              <span className="text-[10px] text-gray-400 mt-0.5 block">Default: 200 LKR</span>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Reservation Hold Period (Days)
              </label>
              <input type="number" min={1} name="holdDays" value={formData.holdDays} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
              <span className="text-[10px] text-gray-400 mt-0.5 block">Default: 3 days</span>
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving} className="px-6 py-2.5 bg-[#1E3A5F] hover:bg-[#162C47] text-white text-xs font-semibold rounded-xl transition shadow-sm flex items-center gap-2 disabled:opacity-50">
          <Save className="w-4 h-4"/>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>);
};
