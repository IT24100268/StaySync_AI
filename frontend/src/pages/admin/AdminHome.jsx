import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Home,
  UtensilsCrossed,
  Truck,
  AlertCircle,
  ShoppingBag,
  Shield,
  RefreshCcw,
  ChevronRight,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  UserPlus,
  Zap,
  TrendingUp,
  Calendar,
} from "lucide-react";
import api from "../../services/api";
import GlassCard from "./components/GlassCard";
import StatCard from "./components/StatCard";
import { useAuth } from "../../context/AuthContext";

export default function AdminHome() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [userChartData, setUserChartData] = useState([]);

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch main stats
      const { data } = await api.get("/admin/analytics/summary/");
      setStats(data);
      
      // Fetch recent activities
      try {
        const activityRes = await api.get("/admin/recent-activities/");
        setActivities(activityRes.data || []);
      } catch (err) {
        console.error("Failed to fetch activities:", err);
        setActivities([]);
      }

      // Fetch user chart data
      try {
        const chartRes = await api.get("/admin/user-activity-chart/");
        setUserChartData(chartRes.data || []);
      } catch (err) {
        console.error("Failed to fetch chart data:", err);
        setUserChartData([]);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      setStats(null);
      setActivities([]);
      setUserChartData([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_0.7fr]">
      <div className="space-y-6">
        <GlassCard className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900">
                Welcome Back, Admin
              </h1>
              <p className="mt-1 text-slate-500">
                Monitor platform performance, approvals, and safety.
              </p>
            </div>

            <button
              onClick={fetchStats}
              className="inline-flex items-center gap-2 rounded-2xl border border-[#dfe7f3] bg-[#f8fbff] px-4 py-2.5 font-semibold text-slate-700 hover:bg-white"
            >
              <RefreshCcw size={18} />
              Refresh
            </button>
          </div>
        </GlassCard>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={Users} label="Active Users" value={stats?.total_users || 0} color="blue" />
          <StatCard icon={Shield} label="Blocked Users" value={stats?.blocked_users || 0} color="red" />
          <StatCard icon={Home} label="Pending Rooms" value={stats?.pending_rooms || 0} color="orange" />
          <StatCard icon={UtensilsCrossed} label="Pending Restaurants" value={stats?.pending_restaurants || 0} color="green" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <GlassCard className="p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Platform Overview</h2>
                <p className="text-sm text-slate-500">Live summary of critical admin actions.</p>
              </div>
              <Link
                to="/admin/analytics"
                className="inline-flex items-center gap-1 text-sm font-bold text-blue-700 hover:underline"
              >
                View Analytics <ChevronRight size={16} />
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <MiniAction
                title="Room Approvals"
                subtitle={`${stats?.pending_rooms || 0} listings waiting review`}
                link="/admin/rooms"
              />
              <MiniAction
                title="Restaurant Approvals"
                subtitle={`${stats?.pending_restaurants || 0} providers waiting review`}
                link="/admin/restaurants"
              />
              <MiniAction
                title="Partner Approvals"
                subtitle={`${stats?.pending_partners || 0} delivery partners pending`}
                link="/admin/partners"
              />
              <MiniAction
                title="Reports Queue"
                subtitle={`${stats?.pending_reports || 0} complaints waiting handling`}
                link="/admin/reports"
              />
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-xl font-extrabold text-slate-900">Orders & Risk</h2>
            <div className="mt-5 space-y-4">
              <SmallKpi
                icon={ShoppingBag}
                label="Orders Today"
                value={stats?.total_orders_today || 0}
                color="bg-indigo-100 text-indigo-700"
              />
              <SmallKpi
                icon={AlertCircle}
                label="Pending Reports"
                value={stats?.pending_reports || 0}
                color="bg-amber-100 text-amber-700"
              />
              <SmallKpi
                icon={Truck}
                label="Pending Partners"
                value={stats?.pending_partners || 0}
                color="bg-violet-100 text-violet-700"
              />
            </div>
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <Zap size={20} className="text-blue-600" />
              <h2 className="text-xl font-extrabold text-slate-900">Quick Actions</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <QuickActionButton
                icon={Users}
                label="Add User"
                link="/admin/users"
                color="bg-blue-50 text-blue-700 hover:bg-blue-100"
              />
              <QuickActionButton
                icon={Home}
                label="Approve Rooms"
                link="/admin/rooms"
                color="bg-green-50 text-green-700 hover:bg-green-100"
              />
              <QuickActionButton
                icon={UtensilsCrossed}
                label="Approve Restaurants"
                link="/admin/restaurants"
                color="bg-orange-50 text-orange-700 hover:bg-orange-100"
              />
              <QuickActionButton
                icon={AlertCircle}
                label="View Reports"
                link="/admin/reports"
                color="bg-red-50 text-red-700 hover:bg-red-100"
              />
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp size={20} className="text-green-600" />
              <h2 className="text-xl font-extrabold text-slate-900">Platform Stats</h2>
            </div>
            
            <div className="space-y-3">
              <StatRow label="Total Revenue" value={stats?.total_revenue ? `$${stats.total_revenue.toLocaleString()}` : '$0'} trend={stats?.revenue_trend || '+0%'} />
              <StatRow label="Active Sessions" value={stats?.active_sessions || 0} trend={stats?.session_trend || '+0%'} />
              <StatRow label="Avg Response Time" value={stats?.avg_response_time ? `${stats.avg_response_time}ms` : 'N/A'} trend={stats?.response_trend || '0%'} />
              <StatRow label="Success Rate" value={stats?.success_rate ? `${stats.success_rate}%` : 'N/A'} trend={stats?.success_trend || '+0%'} />
            </div>
          </GlassCard>
        </div>
      </div>

      <div className="space-y-6">
        <GlassCard className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <Calendar size={20} className="text-blue-600" />
            <h2 className="text-lg font-extrabold text-slate-900">Daily Active Users</h2>
          </div>

          <UserChart data={userChartData} />

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-[#f8fbff] border border-[#e4ebf5] p-3 text-center">
              <p className="text-2xl font-extrabold text-slate-900">{stats?.total_users || 0}</p>
              <p className="text-xs font-semibold text-slate-500">Total Users</p>
            </div>
            <div className="rounded-2xl bg-[#f8fbff] border border-[#e4ebf5] p-3 text-center">
              <p className="text-2xl font-extrabold text-green-600">+{stats?.new_users_today || 12}</p>
              <p className="text-xs font-semibold text-slate-500">Today</p>
            </div>
            <div className="rounded-2xl bg-[#f8fbff] border border-[#e4ebf5] p-3 text-center">
              <p className="text-2xl font-extrabold text-blue-600">{stats?.active_users || 234}</p>
              <p className="text-xs font-semibold text-slate-500">Active</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold text-slate-900">Recent Activity</h2>
            <Link to="/admin/logs" className="text-sm font-bold text-blue-700 hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {activities.slice(0, 5).map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
            {activities.length === 0 && (
              <p className="text-center text-sm text-slate-500 py-4">No recent activities</p>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function MiniAction({ title, subtitle, link }) {
  return (
    <Link
      to={link}
      className="rounded-[22px] border border-[#e4ebf5] bg-[#f8fbff] p-5 transition hover:bg-white hover:shadow-sm"
    >
      <p className="font-extrabold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    </Link>
  );
}

function SmallKpi({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center justify-between rounded-[22px] border border-[#e4ebf5] bg-[#f8fbff] p-4">
      <div className="flex items-center gap-3">
        <div className={`grid h-11 w-11 place-items-center rounded-2xl ${color}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="text-xl font-extrabold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function ProfileStat({ label, value }) {
  return (
    <div className="rounded-2xl bg-white p-3">
      <p className="text-lg font-extrabold text-slate-900">{value}</p>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
    </div>
  );
}

function ActivityItem({ activity }) {
  const getIcon = () => {
    switch (activity.type) {
      case 'user_registered':
        return <UserPlus size={16} className="text-green-600" />;
      case 'room_approved':
      case 'restaurant_approved':
        return <CheckCircle size={16} className="text-blue-600" />;
      case 'report_resolved':
        return <AlertCircle size={16} className="text-orange-600" />;
      case 'user_blocked':
        return <XCircle size={16} className="text-red-600" />;
      default:
        return <Clock size={16} className="text-slate-600" />;
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = Math.floor((now - time) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] p-3">
      <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-xl bg-white">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate">{activity.details}</p>
        <p className="text-xs text-slate-500">{activity.user} • {getTimeAgo(activity.timestamp)}</p>
      </div>
    </div>
  );
}

function QuickActionButton({ icon: Icon, label, link, color }) {
  return (
    <Link
      to={link}
      className={`flex flex-col items-center justify-center gap-2 rounded-2xl border border-[#e4ebf5] p-4 transition ${color}`}
    >
      <Icon size={24} />
      <span className="text-xs font-bold text-center">{label}</span>
    </Link>
  );
}

function StatRow({ label, value, trend }) {
  const isPositive = trend.startsWith('+');
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] p-4">
      <span className="text-sm font-semibold text-slate-600">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-lg font-extrabold text-slate-900">{value}</span>
        <span className={`text-xs font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {trend}
        </span>
      </div>
    </div>
  );
}

function UserChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 rounded-2xl border border-[#e4ebf5] bg-[#f8fbff]">
        <div className="text-center">
          <p className="text-slate-500 font-semibold">No user activity data available</p>
          <p className="text-xs text-slate-400 mt-1">Data will appear once users start using the platform</p>
        </div>
      </div>
    );
  }

  const maxUsers = Math.max(...data.map(d => d.users), 1);

  return (
    <div className="mt-5">
      <div className="flex items-end justify-between gap-2 h-48">
        {data.map((item, index) => {
          const height = maxUsers > 0 ? (item.users / maxUsers) * 100 : 0;
          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div className="relative w-full flex items-end justify-center" style={{ height: '160px' }}>
                <div
                  className="w-full rounded-t-xl bg-gradient-to-t from-blue-600 to-blue-400 transition-all hover:from-blue-700 hover:to-blue-500 cursor-pointer"
                  style={{ height: `${Math.max(height, 5)}%` }}
                  title={`${item.users} users`}
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-900">
                    {item.users}
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-600">{item.day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}