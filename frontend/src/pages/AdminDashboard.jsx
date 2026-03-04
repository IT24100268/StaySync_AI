import { useState, useEffect } from 'react';
import { Users, Home, UtensilsCrossed, ShoppingBag, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import api from '../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingUsers: 0,
    totalRooms: 0,
    totalOrders: 0,
    totalRestaurants: 0,
  });
  const [pendingUsers, setPendingUsers] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchPendingUsers();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/auth/admin/stats/');
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setStats({ totalUsers: 0, pendingUsers: 0, totalRooms: 0, totalOrders: 0, totalRestaurants: 0 });
    }
  };

  const fetchPendingUsers = async () => {
    try {
      console.log('Fetching pending users...');
      const { data } = await api.get('/auth/pending-users/');
      console.log('Pending users response:', data);
      // Handle both array and paginated response
      const users = Array.isArray(data) ? data : (data.results || []);
      setPendingUsers(users);
    } catch (error) {
      console.error('Failed to fetch pending users:', error);
      console.error('Error response:', error.response);
      setPendingUsers([]);
    }
  };

  const approveUser = async (userId) => {
    if (!window.confirm('Are you sure you want to approve this user?')) {
      return;
    }
    try {
      await api.patch(`/auth/approve-user/${userId}/`);
      fetchPendingUsers();
      fetchStats();
      alert('User approved successfully!');
    } catch (error) {
      console.error('Failed to approve user:', error);
      alert('Failed to approve user. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-600 mt-2">Manage your StaySync AI platform</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="blue" />
          <StatCard icon={Home} label="Total Rooms" value={stats.totalRooms} color="green" />
          <StatCard icon={UtensilsCrossed} label="Restaurants" value={stats.totalRestaurants} color="orange" />
          <StatCard icon={ShoppingBag} label="Total Orders" value={stats.totalOrders} color="purple" />
        </div>

        {/* Pending Users */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Pending User Approvals</h2>
            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
              {pendingUsers.length} Pending
            </span>
          </div>

          {pendingUsers.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <CheckCircle className="mx-auto mb-3 text-green-500" size={48} />
              <p className="font-semibold">No pending approvals</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <p className="font-semibold text-slate-900">{user.username}</p>
                    <p className="text-sm text-slate-600">{user.email}</p>
                    <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                      {user.user_type.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <button
                    onClick={() => approveUser(user.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                  >
                    Approve
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <ActionCard
            title="Manage Users"
            description="View and manage all platform users"
            link="/admin/users"
            color="blue"
          />
          <ActionCard
            title="Manage Rooms"
            description="View and manage room listings"
            link="/admin/rooms"
            color="green"
          />
          <ActionCard
            title="View Orders"
            description="Monitor all food orders"
            link="/admin/orders"
            color="purple"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    purple: 'from-purple-500 to-purple-600',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-2xl shadow-lg p-6 text-white`}>
      <div className="flex items-center justify-between mb-4">
        <Icon size={32} />
        <TrendingUp size={20} className="opacity-70" />
      </div>
      <p className="text-3xl font-bold mb-1">{value}</p>
      <p className="text-sm opacity-90">{label}</p>
    </div>
  );
}

function ActionCard({ title, description, link, color }) {
  const colors = {
    blue: 'border-blue-200 hover:border-blue-400 hover:bg-blue-50',
    green: 'border-green-200 hover:border-green-400 hover:bg-green-50',
    purple: 'border-purple-200 hover:border-purple-400 hover:bg-purple-50',
  };

  return (
    <a
      href={link}
      className={`block bg-white rounded-2xl shadow-lg p-6 border-2 ${colors[color]} transition`}
    >
      <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 text-sm">{description}</p>
    </a>
  );
}
