import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { CheckCircle2, AlertCircle } from 'lucide-react';
export const Profile = () => {
    const { user, refreshUser } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [address, setAddress] = useState(user?.address || '');
    const [profileMsg, setProfileMsg] = useState('');
    const [profileLoading, setProfileLoading] = useState(false);
    // Password state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [passMsg, setPassMsg] = useState('');
    const [passErr, setPassErr] = useState('');
    const [passLoading, setPassLoading] = useState(false);
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setProfileLoading(true);
        setProfileMsg('');
        try {
            await api.patch('/auth/me', { name, phone, address });
            await refreshUser();
            setProfileMsg('Contact information updated successfully!');
        }
        catch (err) {
            alert(err.response?.data?.error?.message || 'Failed to update profile');
        }
        finally {
            setProfileLoading(false);
        }
    };
    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPassLoading(true);
        setPassMsg('');
        setPassErr('');
        try {
            await api.patch('/auth/me/password', { currentPassword, newPassword });
            setPassMsg('Password changed successfully!');
            setCurrentPassword('');
            setNewPassword('');
        }
        catch (err) {
            setPassErr(err.response?.data?.error?.message || 'Failed to update password');
        }
        finally {
            setPassLoading(false);
        }
    };
    return (<div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-serif text-3xl font-bold text-[#1A2238]">My Patron Profile</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your contact information and library credentials
        </p>
      </div>

      {/* Account Badge Card */}
      <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 text-[#1E3A5F] flex items-center justify-center font-serif text-2xl font-bold">
            {user?.name?.charAt(0)}
          </div>
          <div>
            <h2 className="font-serif font-bold text-lg text-gray-900">{user?.name}</h2>
            <p className="text-xs text-gray-500">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-[11px] font-medium text-emerald-700 capitalize">
                Account Active
              </span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-gray-400">Patron ID</div>
          <div className="font-mono text-base font-bold text-[#1E3A5F]">
            {user?.memberId || 'N/A'}
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <h3 className="font-serif font-bold text-base text-[#1A2238] border-b border-gray-100 pb-2">
          Contact Details
        </h3>

        {profileMsg && (<div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0"/>
            <span>{profileMsg}</span>
          </div>)}

        <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Full Name</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Phone Number</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="077 123 4567" className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Address / City</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Colombo 03" className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
            </div>
          </div>

          <button type="submit" disabled={profileLoading} className="px-5 py-2 bg-[#1E3A5F] hover:bg-[#162C47] text-white font-semibold rounded-xl transition shadow-sm disabled:opacity-50">
            {profileLoading ? 'Updating...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>

      {/* Change Password Form */}
      <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <h3 className="font-serif font-bold text-base text-[#1A2238] border-b border-gray-100 pb-2">
          Change Password
        </h3>

        {passMsg && (<div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0"/>
            <span>{passMsg}</span>
          </div>)}

        {passErr && (<div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0"/>
            <span>{passErr}</span>
          </div>)}

        <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Current Password *</label>
              <input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">New Password (min 6 chars) *</label>
              <input type="password" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
            </div>
          </div>

          <button type="submit" disabled={passLoading} className="px-5 py-2 bg-gray-800 hover:bg-gray-900 text-white font-semibold rounded-xl transition shadow-sm disabled:opacity-50">
            {passLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>);
};
