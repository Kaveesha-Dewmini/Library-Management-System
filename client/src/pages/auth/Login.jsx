import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, KeyRound, Mail, AlertCircle, ArrowRight } from 'lucide-react';
export const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const user = await login(email, password);
            if (['admin', 'librarian'].includes(user.role)) {
                navigate('/dashboard');
            }
            else {
                navigate('/member');
            }
        }
        catch (err) {
            setError(err.response?.data?.error?.message || 'Login failed. Please check credentials.');
        }
        finally {
            setLoading(false);
        }
    };
    const fillDemo = (demoEmail, demoPass) => {
        setEmail(demoEmail);
        setPassword(demoPass);
        setError('');
    };
    return (<div className="min-h-screen flex bg-[#FAF8F5]">
      {/* Left Bookish Illustration Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1E3A5F] text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="z-10 flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-[#E09F3E]"/>
          </div>
          <span className="font-serif font-bold text-5xl tracking-wide">Shelfwise</span>
        </div>

        <div className="z-10 max-w-md">
          <div className="text-[#E09F3E] text-sm uppercase font-mono tracking-widest mb-3">
            Library Management System
          </div>
          <h1 className="font-serif text-3xl font-bold leading-snug mb-2">
            “A Reader lives thousand lives before he dies. The man who never reads lives only one.”
          </h1>
          <p className="text-[#E09F3E] font-serif italic text-sm mb-4">
            — George R.R. Martin
          </p>
          <p className="text-white/80 text-base leading-relaxed">
            Welcome to Shelfwise Library
          </p>
        </div>

        <div className="z-10"></div>

        {/* Ambient Gradient Blobs */}
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Right Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center lg:text-left">
            <h2 className="font-serif text-3xl font-bold text-[#1A2238]">Welcome Back</h2>
            <p className="text-sm text-gray-500 mt-1">
              Sign in to access your library account or management console
            </p>
          </div>

          {error && (<div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0"/>
              <span>{error}</span>
            </div>)}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400"/>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent transition"/>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400"/>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent transition"/>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 bg-[#1E3A5F] hover:bg-[#162C47] text-white text-sm font-semibold rounded-xl transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign In'}
              <ArrowRight className="w-4 h-4"/>
            </button>
          </form>

          {/* Demo Accounts Quick-Click Box */}
          <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-2.5">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              ⚡ Click to Fill:
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button type="button" onClick={() => fillDemo('admin@shelfwise.test', 'Admin@123')} className="p-2 text-center rounded-lg bg-blue-50 text-[#1E3A5F] font-medium hover:bg-blue-100 transition border border-blue-100">
                Admin
              </button>
              <button type="button" onClick={() => fillDemo('librarian@shelfwise.test', 'Librarian@123')} className="p-2 text-center rounded-lg bg-emerald-50 text-emerald-800 font-medium hover:bg-emerald-100 transition border border-emerald-100">
                Librarian
              </button>
              <button type="button" onClick={() => fillDemo('member@shelfwise.test', 'Member@123')} className="p-2 text-center rounded-lg bg-amber-50 text-amber-800 font-medium hover:bg-amber-100 transition border border-amber-100">
                Member
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-gray-500">
            Don't have a library card?{' '}
            <Link to="/register" className="font-semibold text-[#1E3A5F] hover:underline">
              Register as a member
            </Link>
          </div>
        </div>
      </div>
    </div>);
};
