import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, List, MessageSquare, BarChart3, CheckCircle, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

const navigation = [
  { name: 'Overview', to: '/owner/dashboard', icon: Home },
  { name: 'Listings', to: '/owner/listings', icon: List },
  { name: 'Enquiries', to: '/owner/enquiries', icon: MessageSquare },
  { name: 'Analytics', to: '/owner/analytics', icon: BarChart3 },
  { name: 'Verification', to: '/owner/verification', icon: CheckCircle },
];

export default function OwnerDashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-slate-900 to-blue-900 transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-white">Owner Portal</h1>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white">
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 space-y-2">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/owner/dashboard'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    isActive ? 'bg-white/20 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <item.icon size={20} />
                <span className="font-semibold">{item.name}</span>
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-white/20 pt-4">
            <div className="text-white mb-3">
              <p className="font-semibold">{user?.username}</p>
              <p className="text-sm text-slate-300">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-4 py-2 text-slate-300 hover:bg-white/10 hover:text-white rounded-lg transition"
            >
              <LogOut size={20} />
              <span className="font-semibold">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 py-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-bold text-slate-900">Dashboard</h2>
          </div>
        </header>

        <main className="p-6">
          <Outlet />
        </main>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
