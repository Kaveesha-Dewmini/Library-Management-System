import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, User, Mail, KeyRound, Phone, MapPin, AlertCircle } from 'lucide-react';
export const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        address: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register(formData);
            navigate('/member');
        }
        catch (err) {
            setError(err.response?.data?.error?.message || 'Registration failed.');
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="min-h-screen flex items-center justify-center p-6 bg-[#FAF8F5]">
      <div className="w-full max-w-lg bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto rounded-xl bg-[#1E3A5F] text-[#E09F3E] flex items-center justify-center mb-3">
            <BookOpen className="w-7 h-7"/>
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#1A2238]">Get Your Library Card</h2>
          <p className="text-sm text-gray-500 mt-1">
            Register to borrow books, reserve copies, and track due dates
          </p>
        </div>

        {error && (<div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0"/>
            <span>{error}</span>
          </div>)}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Full Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3.5 text-gray-400"/>
              <input type="text" name="name" required value={formData.name} onChange={handleChange} placeholder="Kasun Perera" className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3.5 text-gray-400"/>
              <input type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="kasun@example.com" className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Password (min 6 chars) *
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-3.5 text-gray-400"/>
              <input type="password" name="password" required minLength={6} value={formData.password} onChange={handleChange} placeholder="••••••••" className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-3.5 text-gray-400"/>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="077 123 4567" className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                City / Address
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-3.5 text-gray-400"/>
                <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Colombo 03" className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-3 bg-[#1E3A5F] hover:bg-[#162C47] text-white text-sm font-semibold rounded-xl transition shadow-sm disabled:opacity-50 mt-2">
            {loading ? 'Creating Account...' : 'Complete Registration'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-500">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-[#1E3A5F] hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>);
};
