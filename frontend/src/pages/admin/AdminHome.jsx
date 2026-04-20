import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users, Home, UtensilsCrossed, Truck, AlertCircle, ShoppingBag,
  Shield, RefreshCcw, ChevronRight, Clock, CheckCircle, XCircle,
  UserPlus, Zap, TrendingUp, Calendar, ShieldOff,
} from "lucide-react";
import api from "../../services/api";
import GlassCard from "./components/GlassCard";
import StatCard from "./components/StatCard";

export default function AdminHome() {
  const [stats, setStats] = useState(null);
  const [overview, setOverview] = useState(null);
  const [hostelOwners, setHostelOwners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [summaryRes, overviewRes, ownersRes] = await Promise.allSettled([
        api.get("/admin/analytics/summary/"),
        api.get("/admin/dashboard/overview/"),
        api.get("/admin/users/?user_type=hostel_owner"),
      ]);

      if (summaryRes.status === "fulfilled") setStats(summaryRes.value.data);
      if (overviewRes.status === "fulfilled") setOverview(overviewRes.value.data);
      if (ownersRes.status === "fulfilled") {
        const d = ownersRes.value.data;
        setHostelOwners(d?.results || d || []);
      }
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

        {/* Header */}
        <GlassCard className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900">Welcome Back, Admin</h1>
              <p className="mt-1 text-slate-500">Monitor platform performance, approvals, and safety.</p>
            </div>
            <button
              onClick={fetchAll}
              className="inline-flex items-center gap-2 rounded-2xl border border-[#dfe7f3] bg-[#f8fbff] px-4 py-2.5 font-semibold text-slate-700 hover:bg-white"
            >
              <RefreshCcw size={18} /> Refresh
            </button>
          </div>
        </GlassCard>

        {/* Stat cards */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={Users}         label="Total Users"          value={stats?.total_users || 0}            color="blue" />
          <StatCard icon={Shield}        label="Blocked Users"        value={stats?.blocked_users || 0}          color="red" />
          <StatCard icon={Home}          label="Pending Owners"       value={stats?.pending_hostel_owners || 0}  color="orange" />
          <StatCard icon={UtensilsCrossed} label="Pending Restaurants" value={stats?.pending_restaurants || 0}  color="green" />
        </div>

        {/* Platform Overview */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <GlassCard className="p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Platform Overview</h2>
                <p className="text-sm text-slate-500">Live summary of critical admin actions.</p>
              </div>
              <Link to="/admin/analytics" className="inline-flex items-center gap-1 text-sm font-bold text-blue-700 hover:underline">
                View Analytics <ChevronRight size={16} />
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Owner Approvals — live list */}
              <div className="rounded-[22px] border border-[#e4ebf5] bg-[#f8fbff] p-5 md:col-span-2">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-extrabold text-slate-900">Owner Approvals</p>
                  <Link to="/admin/rooms" className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline">
                    View All <ChevronRight size={13} />
                  </Link>
                </div>
                {hostelOwners.length === 0 ? (
                  <p className="text-sm text-slate-400">No hostel owners registered yet.</p>
                ) : (
                  <div className="space-y-2">
                    {hostelOwners.slice(0, 5).map((owner) => (
                      <OwnerRow key={owner.id} owner={owner} />
                    ))}
                    {hostelOwners.length > 5 && (
                      <Link to="/admin/rooms" className="block pt-1 text-center text-xs font-bold text-blue-600 hover:underline">
                        +{hostelOwners.length - 5} more owners
                      </Link>
                    )}
                  </div>
                )}
              </div>

              <MiniAction title="Restaurant Approvals" subtitle={`${stats?.pending_restaurants || 0} providers waiting`} link="/admin/restaurants" />
              <MiniAction title="Partner Approvals"    subtitle={`${stats?.pending_partners || 0} partners pending`}   link="/admin/partners" />
              <MiniAction title="Reports Queue"        subtitle={`${stats?.pending_reports || 0} complaints pending`}  link="/admin/reports" />
            </div>
          </GlassCard>

          {/* Orders & Risk */}
          <GlassCard className="p-6">
            <h2 className="text-xl font-extrabold text-slate-900">Orders & Risk</h2>
            <div className="mt-5 space-y-4">
              <SmallKpi icon={ShoppingBag} label="Orders Today"      value={stats?.total_orders_today || 0}  color="bg-indigo-100 text-indigo-700" />
              <SmallKpi icon={AlertCircle} label="Pending Reports"   value={stats?.pending_reports || 0}     color="bg-amber-100 text-amber-700" />
              <SmallKpi icon={Truck}       label="Pending Partners"  value={stats?.pending_partners || 0}    color="bg-violet-100 text-violet-700" />
            </div>
          </GlassCard>
        </div>

        {/* Quick Actions + Platform Stats */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <GlassCard className="p-6">
            <div className="mb-5 flex items-center gap-2">
              <Zap size={20} className="text-blue-600" />
              <h2 className="text-xl font-extrabold text-slate-900">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <QuickActionButton icon={Users}          label="Manage Users"        link="/admin/users"       color="bg-blue-50 text-blue-700 hover:bg-blue-100" />
              <QuickActionButton icon={Home}           label="Approve Owners"      link="/admin/rooms"       color="bg-green-50 text-green-700 hover:bg-green-100" />
              <QuickActionButton icon={UtensilsCrossed} label="Approve Restaurants" link="/admin/restaurants" color="bg-orange-50 text-orange-700 hover:bg-orange-100" />
              <QuickActionButton icon={AlertCircle}   label="View Reports"        link="/admin/reports"     color="bg-red-50 text-red-700 hover:bg-red-100" />
            </div>
          </GlassCard>

          {/* Platform Stats — real data only */}
          <GlassCard className="p-6">
            <div className="mb-5 flex items-center gap-2">
              <TrendingUp size={20} className="text-green-600" />
              <h2 className="text-xl font-extrabold text-slate-900">Platform Stats</h2>
            </div>
            <div className="space-y-3">
              <StatRow label="Total Orders"         value={overview?.orders_total || 0} />
              <StatRow label="New Users (7 days)"   value={overview?.new_users_7d || 0} />
              <StatRow label="Approved Owners"      value={overview?.approved_hostel_owners || 0} />
              <StatRow label="Approved Restaurants" value={overview?.approved_restaurants || 0} />
              <StatRow label="Approved Partners"    value={overview?.approved_partners || 0} />
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Right column */}
      <div className="space-y-6">
        {/* User registrations chart */}
        <GlassCard className="p-6">
          <div className="mb-5 flex items-center gap-2">
            <Calendar size={20} className="text-blue-600" />
            <h2 className="text-lg font-extrabold text-slate-900">New Registrations (7 days)</h2>
          </div>

          <UserChart data={overview?.user_trend || []} />

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] p-3 text-center">
              <p className="text-2xl font-extrabold text-slate-900">{stats?.total_users || 0}</p>
              <p className="text-xs font-semibold text-slate-500">Total</p>
            </div>
            <div className="rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] p-3 text-center">
              <p className="text-2xl font-extrabold text-green-600">+{overview?.new_users_today || 0}</p>
              <p className="text-xs font-semibold text-slate-500">Today</p>
            </div>
            <div className="rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] p-3 text-center">
              <p className="text-2xl font-extrabold text-blue-600">+{overview?.new_users_7d || 0}</p>
              <p className="text-xs font-semibold text-slate-500">This Week</p>
            </div>
          </div>
        </GlassCard>

        {/* Recent Activity — real admin logs */}
        <GlassCard className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900">Recent Activity</h2>
            <Link to="/admin/logs" className="text-sm font-bold text-blue-700 hover:underline">View All</Link>
          </div>
          <div className="space-y-3">
            {(overview?.recent_logs || []).length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-500">No recent activity</p>
            ) : (
              (overview?.recent_logs || []).map((log) => (
                <LogItem key={log.id} log={log} />
              ))
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function OwnerRow({ owner }) {
  const name = owner.profile?.hostel_name || owner.username;
  const image = owner.profile?.display_image;
  let badge;
  if (owner.is_blocked)
    badge = <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-extrabold text-rose-700">Blocked</span>;
  else if (owner.is_approved)
    badge = <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-extrabold text-emerald-700">Approved</span>;
  else
    badge = <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-extrabold text-amber-700">Pending</span>;

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#e4ebf5] bg-white px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-[#e4ebf5] bg-[#f8fbff]">
          {image
            ? <img src={image} alt={name} className="h-full w-full object-cover" />
            : <div className="grid h-full w-full place-items-center text-sm font-extrabold text-slate-500">{name[0]?.toUpperCase()}</div>
          }
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">{name}</p>
          <p className="truncate text-xs text-slate-400">{owner.email}</p>
        </div>
      </div>
      {badge}
    </div>
  );
}

function LogItem({ log }) {
  const action = log.action || "";
  let icon = <Clock size={15} className="text-slate-500" />;
  if (action.toLowerCase().includes("approved"))  icon = <CheckCircle size={15} className="text-emerald-600" />;
  else if (action.toLowerCase().includes("blocked")) icon = <ShieldOff size={15} className="text-rose-600" />;
  else if (action.toLowerCase().includes("unblocked")) icon = <CheckCircle size={15} className="text-blue-600" />;
  else if (action.toLowerCase().includes("registered")) icon = <UserPlus size={15} className="text-green-600" />;
  else if (action.toLowerCase().includes("report")) icon = <AlertCircle size={15} className="text-amber-600" />;
  else if (action.toLowerCase().includes("rejected")) icon = <XCircle size={15} className="text-red-600" />;

  const timeAgo = (iso) => {
    const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] p-3">
      <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-white">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">{log.action}</p>
        <p className="text-xs text-slate-400">{log.admin_username} · {timeAgo(log.created_at)}</p>
      </div>
    </div>
  );
}

function MiniAction({ title, subtitle, link }) {
  return (
    <Link to={link} className="rounded-[22px] border border-[#e4ebf5] bg-[#f8fbff] p-5 transition hover:bg-white hover:shadow-sm">
      <p className="font-extrabold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    </Link>
  );
}

function SmallKpi({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-3 rounded-[22px] border border-[#e4ebf5] bg-[#f8fbff] p-4">
      <div className={`grid h-11 w-11 place-items-center rounded-2xl ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <p className="text-xl font-extrabold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] px-4 py-3">
      <span className="text-sm font-semibold text-slate-600">{label}</span>
      <span className="text-lg font-extrabold text-slate-900">{value}</span>
    </div>
  );
}

function QuickActionButton({ icon: Icon, label, link, color }) {
  return (
    <Link to={link} className={`flex flex-col items-center justify-center gap-2 rounded-2xl border border-[#e4ebf5] p-4 transition ${color}`}>
      <Icon size={24} />
      <span className="text-xs font-bold text-center">{label}</span>
    </Link>
  );
}

function UserChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl border border-[#e4ebf5] bg-[#f8fbff]">
        <p className="text-sm font-semibold text-slate-400">No registration data yet</p>
      </div>
    );
  }
  const max = Math.max(...data.map((d) => d.users), 1);
  return (
    <div className="flex items-end justify-between gap-1.5" style={{ height: "120px" }}>
      {data.map((item, i) => {
        const pct = Math.max((item.users / max) * 100, 4);
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] font-bold text-slate-600">{item.users > 0 ? item.users : ""}</span>
            <div
              className="w-full rounded-t-lg bg-gradient-to-t from-blue-600 to-blue-400"
              style={{ height: `${pct}%` }}
              title={`${item.users} registrations`}
            />
            <span className="text-[10px] font-bold text-slate-500">{item.day}</span>
          </div>
        );
      })}
    </div>
  );
}
