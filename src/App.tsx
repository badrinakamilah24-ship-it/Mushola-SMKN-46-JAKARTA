import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { seedDatabase } from './lib/db';
import { AuthProvider, useAuth } from './lib/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import { LogOut, User as UserIcon } from 'lucide-react';

const ProtectedRoute = ({ children, allowedRole }: { children: React.ReactNode, allowedRole: string }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (user.role !== allowedRole) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/user'} replace />;
  }
  
  return <>{children}</>;
};

const Navigation = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-emerald-800 text-white shadow-md select-none sticky top-0 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2 hover:opacity-90 transition">
              <div className="bg-white p-1.5 rounded-full">
                 <svg className="w-6 h-6 text-emerald-800" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                </svg>
              </div>
              <span className="font-bold text-lg hidden sm:block tracking-wide">MUSHOLA SMKN 46 JAKARTA</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {!user ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/daftar"
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-md text-sm font-medium transition border border-white/20"
                >
                  Daftar
                </Link>
                <Link
                  to="/login"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-md text-sm font-medium transition"
                >
                  Login
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  to={user.role === 'admin' ? '/admin' : '/user'}
                  className="flex items-center gap-2 text-sm font-medium hover:text-emerald-200 transition"
                >
                  <UserIcon size={18} />
                  <span>{user.role === 'admin' ? 'Admin' : `${user.name} (Siswa)`}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 bg-red-600/90 hover:bg-red-500 px-3 py-1.5 rounded-md text-sm font-medium transition"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

const InitialRedirect = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  useEffect(() => {
    const entries = performance.getEntriesByType("navigation");
    if (entries.length > 0 && (entries[0] as PerformanceNavigationTiming).type === "reload") {
      logout();
      navigate('/', { replace: true });
    }
  }, [navigate, logout]);
  return null;
};

export default function App() {
  useEffect(() => {
    seedDatabase();
  }, []);

  return (
    <AuthProvider>
      <Router>
        <InitialRedirect />
        <div className="min-h-screen bg-neutral-50 flex flex-col font-sans">
          <Navigation />
          <main className="flex-1 flex flex-col w-full">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/daftar" element={<LoginPage isRegister={true} />} />
              <Route 
                path="/admin/*" 
                element={
                  <ProtectedRoute allowedRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/user/*" 
                element={
                  <ProtectedRoute allowedRole="user">
                    <UserDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}
