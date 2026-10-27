import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
// Auth Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
// Staff Pages
import { Dashboard } from './pages/staff/Dashboard';
import { Circulation } from './pages/staff/Circulation';
import { Books } from './pages/staff/Books';
import { Categories } from './pages/staff/Categories';
import { Members } from './pages/staff/Members';
import { Loans } from './pages/staff/Loans';
import { Reservations } from './pages/staff/Reservations';
import { Fines } from './pages/staff/Fines';
import { Reports } from './pages/staff/Reports';
import { Settings } from './pages/staff/Settings';
import { StaffManagement } from './pages/staff/StaffManagement';
import { AuditLogs } from './pages/staff/AuditLogs';
// Member Pages
import { MemberHome } from './pages/member/MemberHome';
import { Catalogue } from './pages/member/Catalogue';
import { MyLoans } from './pages/member/MyLoans';
import { MyReservations } from './pages/member/MyReservations';
import { MyFines } from './pages/member/MyFines';
import { Profile } from './pages/member/Profile';
// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();
    if (loading) {
        return (<div className="min-h-screen flex items-center justify-center bg-[#FAF8F5]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#1E3A5F] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="font-serif font-bold text-sm text-[#1A2238]">Loading Shelfwise...</p>
        </div>
      </div>);
    }
    if (!user) {
        return <Navigate to="/login" replace/>;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to={user.role === 'member' ? '/member' : '/dashboard'} replace/>;
    }
    return <>{children}</>;
};
export const App = () => {
    const { user } = useAuth();
    return (<Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />}/>
      <Route path="/register" element={<Register />}/>

      {/* Main Authenticated App Layout */}
      <Route path="/" element={<ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>}>
        {/* Root Redirect based on role */}
        <Route index element={user && ['admin', 'librarian'].includes(user.role) ? (<Navigate to="/dashboard" replace/>) : (<Navigate to="/member" replace/>)}/>

        {/* Staff & Admin Operations */}
        <Route path="dashboard" element={<ProtectedRoute allowedRoles={['admin', 'librarian']}>
              <Dashboard />
            </ProtectedRoute>}/>
        <Route path="circulation" element={<ProtectedRoute allowedRoles={['admin', 'librarian']}>
              <Circulation />
            </ProtectedRoute>}/>
        <Route path="books" element={<Books />}/>
        <Route path="categories" element={<ProtectedRoute allowedRoles={['admin', 'librarian']}>
              <Categories />
            </ProtectedRoute>}/>
        <Route path="members" element={<ProtectedRoute allowedRoles={['admin', 'librarian']}>
              <Members />
            </ProtectedRoute>}/>
        <Route path="loans" element={<ProtectedRoute allowedRoles={['admin', 'librarian']}>
              <Loans />
            </ProtectedRoute>}/>
        <Route path="reservations" element={<ProtectedRoute allowedRoles={['admin', 'librarian']}>
              <Reservations />
            </ProtectedRoute>}/>
        <Route path="fines" element={<ProtectedRoute allowedRoles={['admin', 'librarian']}>
              <Fines />
            </ProtectedRoute>}/>
        <Route path="reports" element={<ProtectedRoute allowedRoles={['admin', 'librarian']}>
              <Reports />
            </ProtectedRoute>}/>
        <Route path="settings" element={<ProtectedRoute allowedRoles={['admin']}>
              <Settings />
            </ProtectedRoute>}/>
        <Route path="staff" element={<ProtectedRoute allowedRoles={['admin']}>
              <StaffManagement />
            </ProtectedRoute>}/>
        <Route path="audit-logs" element={<ProtectedRoute allowedRoles={['admin']}>
              <AuditLogs />
            </ProtectedRoute>}/>

        {/* Member Portal */}
        <Route path="member" element={<ProtectedRoute allowedRoles={['member', 'admin', 'librarian']}>
              <MemberHome />
            </ProtectedRoute>}/>
        <Route path="catalogue" element={<Catalogue />}/>
        <Route path="my-loans" element={<MyLoans />}/>
        <Route path="my-reservations" element={<MyReservations />}/>
        <Route path="my-fines" element={<MyFines />}/>
        <Route path="profile" element={<Profile />}/>
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={<div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#FAF8F5]">
            <h1 className="font-serif text-6xl font-bold text-[#1E3A5F]">404</h1>
            <p className="font-serif text-xl font-semibold text-gray-800 mt-2">
              This page has been checked out.
            </p>
            <p className="text-xs text-gray-500 mt-1 max-w-sm">
              The page you are looking for does not exist on this shelf.
            </p>
            <a href="/" className="mt-6 px-5 py-2.5 bg-[#1E3A5F] text-white text-xs font-semibold rounded-xl hover:bg-[#162C47] transition shadow-sm">
              Return Home
            </a>
          </div>}/>
    </Routes>);
};
