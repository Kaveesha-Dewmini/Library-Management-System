import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, LogOut } from 'lucide-react';
export const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    return (<header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2.5 font-serif font-bold text-xl text-[#1E3A5F]">
          <div className="w-9 h-9 rounded-xl bg-[#1E3A5F] text-white flex items-center justify-center shadow-sm">
            <BookOpen className="w-5 h-5 text-amber-brand"/>
          </div>
          <span>Shelfwise</span>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {user ? (<div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-[#1A2238] leading-tight">{user.name}</div>
              <div className="text-xs text-gray-500 capitalize flex items-center justify-end gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {user.role} {user.memberId && `• ${user.memberId}`}
              </div>
            </div>

            <div className="w-10 h-10 rounded-full bg-blue-100 text-[#1E3A5F] font-serif font-bold flex items-center justify-center border border-blue-200">
              {user.name.charAt(0)}
            </div>

            <button onClick={handleLogout} title="Sign Out" className="p-2 rounded-xl text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition">
              <LogOut className="w-5 h-5"/>
            </button>
          </div>) : (<div className="flex items-center gap-2">
            <Link to="/login" className="px-4 py-2 text-sm font-medium text-[#1E3A5F] hover:bg-gray-100 rounded-xl transition">
              Sign In
            </Link>
            <Link to="/register" className="px-4 py-2 text-sm font-medium text-white bg-[#1E3A5F] hover:bg-[#162C47] rounded-xl transition shadow-sm">
              Register
            </Link>
          </div>)}
      </div>
    </header>);
};
