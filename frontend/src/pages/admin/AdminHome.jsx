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
  TrendingUp,
  Clock,
  RefreshCcw,
  ChevronRight,
} from "lucide-react";
import api from "../../services/api";

// Optional: if you already created GlassCard at src/pages/admin/components/GlassCard.jsx
import GlassCard from "./components/GlassCard";

export default function AdminHome() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/analytics/summary/");
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <GlassCard className="p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">
              Welcome Back, Admin!
            </h1>
            <p className="text-slate-600 mt-1">
              Monitor overall platform activity and handle approvals fast.
            </p>
          </div>

          <button
            onClick={fetchStats}
            className="px-4 py-3 rounded-2xl bg-white/70 border border-white/50 hover:bg-white/90 transition font-semibold text-slate-800"
          >
            <span className="flex items-center gap-2">
              <RefreshCcw size={18} />
              Refresh
            </span>
          </button>
        </div>
      </GlassCard>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <KPI
          icon={Users}
          label="Active Users"
          value={stats?.total_users || 0}
          tint="blue"
          link="/admin/users"
        />
        <KPI
          icon={Shield}
          label="Blocked Users"
          value={stats?.blocked_users || 0}
          tint="rose"
          link="/admin/users"
        />
        <KPI
          icon={Home}
          label="Pending Rooms"
          value={stats?.pending_rooms || 0}
          tint="amber"
          link="/admin/rooms"
        />
        <KPI
          icon={UtensilsCrossed}
          label="Pending Restaurants"
          value={stats?.pending_restaurants || 0}
          tint="emerald"
          link="/admin/restaurants"
        />
        <KPI
          icon={Truck}
          label="Pending Partners"
          value={stats?.pending_partners || 0}
          tint="violet"
          link="/admin/partners"
        />
        <KPI
          icon={AlertCircle}
          label="Pending Reports"
          value={stats?.pending_reports || 0}
          tint="orange"
          link="/admin/reports"
        />
        <KPI
          icon={ShoppingBag}
          label="Orders Today"
          value={stats?.total_orders_today || 0}
          tint="indigo"
          link="/admin/orders"
        />
        <KPI
          icon={Clock}
          label="Disputes Pending"
          value={stats?.disputes_pending || 0}
          tint="pink"
          link="/admin/orders"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <QuickAction
          title="Room Approvals"
          description="Review and approve pending room listings"
          link="/admin/rooms"
          count={stats?.pending_rooms || 0}
          tint="blue"
        />
        <QuickAction
          title="Restaurant Approvals"
          description="Review and approve restaurant registrations"
          link="/admin/restaurants"
          count={stats?.pending_restaurants || 0}
          tint="emerald"
        />
        <QuickAction
          title="Reports Queue"
          description="Handle user reports and complaints"
          link="/admin/reports"
          count={stats?.pending_reports || 0}
          tint="orange"
        />
      </div>

      {/* Optional: “Platform Overview” block */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Platform Overview
            </h2>
            <p className="text-slate-600 text-sm mt-1">
              Keep an eye on what needs attention right now.
            </p>
          </div>

          <Link
            to="/admin/analytics"
            className="px-4 py-2 rounded-2xl bg-white/70 border border-white/50 hover:bg-white/90 transition font-semibold text-slate-800"
          >
            <span className="flex items-center gap-2">
              View Analytics <ChevronRight size={18} />
            </span>
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          <MiniStat label="Approvals Pending" value={(stats?.pending_rooms || 0) + (stats?.pending_restaurants || 0) + (stats?.pending_partners || 0)} />
          <MiniStat label="Reports Pending" value={stats?.pending_reports || 0} />
          <MiniStat label="Orders Today" value={stats?.total_orders_today || 0} />
        </div>
      </GlassCard>
    </div>
  );
}

/** ✅ KPI Card (glass) */
function KPI({ icon: Icon, label, value, tint, link }) {
  const tintStyles = {
    blue: "from-blue-600 to-indigo-600",
    rose: "from-rose-600 to-red-600",
    amber: "from-amber-600 to-orange-600",
    emerald: "from-emerald-600 to-green-600",
    violet: "from-violet-600 to-purple-600",
    orange: "from-orange-600 to-amber-600",
    indigo: "from-indigo-600 to-blue-600",
    pink: "from-pink-600 to-rose-600",
  };

  const Card = (
    <div className="group rounded-3xl bg-white/55 backdrop-blur-xl border border-white/40 shadow-[0_12px_35px_rgba(15,23,42,0.10)] p-5 hover:bg-white/70 transition">
      <div className="flex items-center justify-between">
        <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${tintStyles[tint]} text-white grid place-items-center`}>
          <Icon size={22} />
        </div>
        <TrendingUp size={18} className="text-slate-500 group-hover:text-slate-700 transition" />
      </div>

      <div className="mt-4">
        <p className="text-3xl font-extrabold text-slate-900">{value}</p>
        <p className="text-sm font-semibold text-slate-600 mt-1">{label}</p>
      </div>
    </div>
  );

  return link ? <Link to={link}>{Card}</Link> : Card;
}

/** ✅ Quick Action (glass + badge) */
function QuickAction({ title, description, link, count, tint }) {
  const ring = {
    blue: "hover:ring-blue-200",
    emerald: "hover:ring-emerald-200",
    orange: "hover:ring-orange-200",
  }[tint];

  const badge = {
    blue: "bg-blue-100 text-blue-700",
    emerald: "bg-emerald-100 text-emerald-700",
    orange: "bg-orange-100 text-orange-700",
  }[tint];

  return (
    <Link to={link}>
      <div className={`rounded-3xl bg-white/55 backdrop-blur-xl border border-white/40 shadow-[0_12px_35px_rgba(15,23,42,0.10)] p-6 transition hover:bg-white/70 hover:ring-4 ${ring}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-extrabold text-slate-900">{title}</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${badge}`}>
            {count} Pending
          </span>
        </div>
        <p className="text-slate-600 text-sm">{description}</p>

        <div className="mt-4 text-slate-800 font-semibold flex items-center gap-2">
          Open <ChevronRight size={18} />
        </div>
      </div>
    </Link>
  );
}

/** ✅ Small stats inside overview */
function MiniStat({ label, value }) {
  return (
    <div className="p-4 rounded-3xl bg-white/50 border border-white/40">
      <p className="text-xs font-extrabold text-slate-500 uppercase">{label}</p>
      <p className="text-2xl font-extrabold text-slate-900 mt-1">{value}</p>
    </div>
  );
}