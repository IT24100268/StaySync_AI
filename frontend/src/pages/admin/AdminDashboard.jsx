import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Home,
  UtensilsCrossed,
  ShoppingBag,
  CheckCircle,
  Clock,
  Shield,
  AlertCircle,
  UserCheck,
} from "lucide-react";
import api from "../../services/api";
import GlassCard from "./components/GlassCard";
import StatCard from "./components/StatCard";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const ordersToday = useMemo(
    () => stats?.orders_today ?? stats?.total_orders_today ?? 0,
    [stats]
  );

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: analyticsData } = await api.get("/admin/analytics/summary/");
      setStats(analyticsData);

      const { data: logsData } = await api.get("/admin/logs/?limit=8");
      setRecentLogs(logsData.results || logsData || []);

      const { data: usersData } = await api.get("/admin/users/?is_approved=false");
      setPendingUsers(Array.isArray(usersData) ? usersData : usersData.results || []);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (userId) => {
    if (!window.confirm("Approve this user?")) return;
    try {
      await api.patch(`/admin/users/${userId}/approve/`);
      fetchData();
    } catch (error) {
      console.error("Failed to approve user:", error);
      alert("Failed to approve user. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">
              Welcome Back, Admin!
            </h1>
            <p className="text-slate-600 mt-1">
              Monitor overall platform activity and safety.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="px-4 py-2 rounded-2xl bg-white/70 border border-white/50 hover:bg-white/90 transition font-semibold text-slate-800"
            >
              Refresh
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard icon={Users} label="Active Users" value={stats?.total_users || 0} color="blue" />
        <StatCard icon={Shield} label="Blocked Users" value={stats?.blocked_users || 0} color="red" />
        <StatCard icon={Home} label="Pending Rooms" value={stats?.pending_rooms || 0} color="orange" />
        <StatCard icon={UtensilsCrossed} label="Pending Restaurants" value={stats?.pending_restaurants || 0} color="green" />
        <StatCard icon={AlertCircle} label="Pending Reports" value={stats?.pending_reports || 0} color="yellow" />
        <StatCard icon={ShoppingBag} label="Orders Today" value={ordersToday} color="purple" />
        <StatCard icon={UserCheck} label="Pending Users" value={pendingUsers.length} color="indigo" />
        <StatCard icon={Clock} label="Disputes Pending" value={stats?.disputes_pending || 0} color="pink" />
      </div>

      {/* Overview Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Platform Overview */}
        <GlassCard className="p-6 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-extrabold text-slate-900">Platform Overview</h2>
            <div className="flex gap-2">
              <Link
                to="/admin/rooms"
                className="px-3 py-2 rounded-2xl bg-white/70 border border-white/50 hover:bg-white/90 transition text-sm font-semibold"
              >
                View Rooms
              </Link>
              <Link
                to="/admin/reports"
                className="px-3 py-2 rounded-2xl bg-white/70 border border-white/50 hover:bg-white/90 transition text-sm font-semibold"
              >
                View Reports
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MiniCard
              title="New Room Listings"
              subtitle={`${stats?.pending_rooms || 0} pending approvals`}
              to="/admin/rooms"
            />
            <MiniCard
              title="New Restaurants"
              subtitle={`${stats?.pending_restaurants || 0} pending approvals`}
              to="/admin/restaurants"
            />
            <MiniCard
              title="Reports Queue"
              subtitle={`${stats?.pending_reports || 0} pending reports`}
              to="/admin/reports"
            />
            <MiniCard
              title="Users"
              subtitle={`${stats?.total_users || 0} total users`}
              to="/admin/users"
            />
          </div>
        </GlassCard>

        {/* Live / Recent Activity */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-extrabold text-slate-900">Recent Activity</h2>
            <Link
              to="/admin/logs"
              className="text-sm font-semibold text-blue-700 hover:underline"
            >
              View all
            </Link>
          </div>

          {recentLogs.length === 0 ? (
            <div className="text-center text-slate-600 py-10">
              No recent activity
            </div>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between gap-3 p-3 rounded-2xl bg-white/50 border border-white/40"
                >
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{log.action}</p>
                    <p className="text-xs text-slate-600 mt-1">
                      {log.target_type} #{log.target_id} • {log.admin_username}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Pending Users */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-xl font-extrabold text-slate-900">Pending User Approvals</h2>
          <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-sm font-bold">
            {pendingUsers.length} Pending
          </span>
        </div>

        {pendingUsers.length === 0 ? (
          <div className="text-center py-10 text-slate-600">
            <CheckCircle className="mx-auto mb-3 text-emerald-600" size={44} />
            <p className="font-semibold">No pending approvals</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pendingUsers.map((u) => (
              <div
                key={u.id}
                className="p-4 rounded-3xl bg-white/50 border border-white/40 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="font-extrabold text-slate-900">{u.username}</p>
                  <p className="text-sm text-slate-600">{u.email}</p>
                  <span className="inline-block mt-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                    {String(u.user_type || "").replace("_", " ").toUpperCase()}
                  </span>
                </div>

                <button
                  onClick={() => approveUser(u.id)}
                  className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 transition text-white font-bold"
                >
                  Approve
                </button>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function MiniCard({ title, subtitle, to }) {
  return (
    <Link
      to={to}
      className="p-5 rounded-3xl bg-white/50 border border-white/40 hover:bg-white/70 transition block"
    >
      <p className="font-extrabold text-slate-900">{title}</p>
      <p className="text-sm text-slate-600 mt-1">{subtitle}</p>
    </Link>
  );
}
