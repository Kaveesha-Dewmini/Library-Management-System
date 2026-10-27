import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Repeat, Book, Tags, Users, FileText, BookmarkCheck, CircleDollarSign, BarChart3, Settings, ShieldCheck, History, Home, Search, BookOpenCheck, Clock, UserCheck } from 'lucide-react';
export const Sidebar = () => {
    const { user } = useAuth();
    if (!user)
        return null;
    const isStaff = ['admin', 'librarian'].includes(user.role);
    const isAdmin = user.role === 'admin';
    const staffLinks = [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/circulation', label: 'Circulation Desk', icon: Repeat },
        { to: '/books', label: 'Catalogue (Books)', icon: Book },
        { to: '/categories', label: 'Categories', icon: Tags },
        { to: '/members', label: 'Members', icon: Users },
        { to: '/loans', label: 'All Loans', icon: FileText },
        { to: '/reservations', label: 'Reservations', icon: BookmarkCheck },
        { to: '/fines', label: 'Fines Management', icon: CircleDollarSign },
        { to: '/reports', label: 'Analytics & Reports', icon: BarChart3 }
    ];
    const adminLinks = [
        { to: '/settings', label: 'Library Settings', icon: Settings },
        { to: '/staff', label: 'Staff Management', icon: ShieldCheck },
        { to: '/audit-logs', label: 'Audit Logs', icon: History }
    ];
    const memberLinks = [
        { to: '/member', label: 'My Library Home', icon: Home },
        { to: '/catalogue', label: 'Browse Catalogue', icon: Search },
        { to: '/my-loans', label: 'My Loans', icon: BookOpenCheck },
        { to: '/my-reservations', label: 'My Reservations', icon: Clock },
        { to: '/my-fines', label: 'My Fines', icon: CircleDollarSign },
        { to: '/profile', label: 'My Profile', icon: UserCheck }
    ];
    const linkClass = ({ isActive }) => `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${isActive
        ? 'bg-[#E09F3E] text-white shadow-sm'
        : 'text-gray-300 hover:text-white hover:bg-white/10'}`;
    return (<aside className="w-64 bg-[#1E3A5F] text-white flex flex-col min-h-[calc(100vh-4rem)] p-4 border-r border-blue-900/40 select-none">
      <div className="flex-1 space-y-6">
        {isStaff ? (<>
            <div>
              <div className="px-3 text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                Operations
              </div>
              <nav className="space-y-1">
                {staffLinks.map((item) => {
                const Icon = item.icon;
                return (<NavLink key={item.to} to={item.to} className={linkClass}>
                      <Icon className="w-4 h-4"/>
                      <span>{item.label}</span>
                    </NavLink>);
            })}
              </nav>
            </div>

            {isAdmin && (<div>
                <div className="px-3 text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                  Administration
                </div>
                <nav className="space-y-1">
                  {adminLinks.map((item) => {
                    const Icon = item.icon;
                    return (<NavLink key={item.to} to={item.to} className={linkClass}>
                        <Icon className="w-4 h-4"/>
                        <span>{item.label}</span>
                      </NavLink>);
                })}
                </nav>
              </div>)}
          </>) : (<div>
            <div className="px-3 text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
              Member Portal
            </div>
            <nav className="space-y-1">
              {memberLinks.map((item) => {
                const Icon = item.icon;
                return (<NavLink key={item.to} to={item.to} className={linkClass}>
                    <Icon className="w-4 h-4"/>
                    <span>{item.label}</span>
                  </NavLink>);
            })}
            </nav>
          </div>)}
      </div>

      <div className="pt-4 border-t border-white/10 text-xs text-white/60 text-center">
        Shelfwise Library System
      </div>
    </aside>);
};
