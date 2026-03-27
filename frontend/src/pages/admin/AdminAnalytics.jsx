import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Bike,
  Building2,
  Clock3,
  ShieldCheck,
  ShoppingBag,
  Store,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../../services/api";

const userMixColors = ["#4f46e5", "#f97316", "#14b8a6", "#ec4899"];
const orderStatusColors = ["#f59e0b", "#38bdf8", "#ef4444", "#6366f1", "#8b5cf6", "#10b981", "#64748b"];

const formatMetric = (value) => Number(value || 0).toLocaleString();

function MetricCard({ title, value, subtitle, icon: Icon, accent }) {
  return (
    <div className="relative overflow-hidden rounded-[30px] border border-white/70 bg-white p-5 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.35)]">
      <div className={`absolute inset-x-0 top-0 h-1.5 ${accent}`} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">{title}</p>
          <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-900">{value}</h3>
          <p className="mt-2 text-sm font-medium text-slate-500">{subtitle}</p>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-900 text-white">
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function InsightRow({ icon: Icon, title, value, note, tone = "slate" }) {
  const toneMap = {
    slate: "bg-slate-100 text-slate-700",
    indigo: "bg-indigo-100 text-indigo-700",
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <div className={`grid h-11 w-11 place-items-center rounded-2xl ${toneMap[tone]}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-slate-900">{title}</p>
          <span className="text-base font-black text-slate-900">{value}</span>
        </div>
        <p className="mt-1 text-xs leading-5 text-slate-500">{note}</p>
      </div>
    </div>
  );
}

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState({
    metrics: {},
    trend: [],
    user_mix: [],
    order_status: [],
    moderation_pipeline: [],
    top_restaurants: [],
    recent_admin_actions: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        const response = await api.get("/admin/analytics/detail/");
        setAnalytics({
          metrics: response.data?.metrics || {},
          trend: response.data?.trend || [],
          user_mix: response.data?.user_mix || [],
          order_status: response.data?.order_status || [],
          moderation_pipeline: response.data?.moderation_pipeline || [],
          top_restaurants: response.data?.top_restaurants || [],
          recent_admin_actions: response.data?.recent_admin_actions || [],
        });
      } catch (error) {
        console.error("Failed to load analytics", error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-10">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Users"
          value={formatMetric(analytics.metrics.total_users)}
          subtitle={`${formatMetric(analytics.metrics.new_users_7d)} joined in the last 7 days`}
          icon={Users}
          accent="bg-gradient-to-r from-indigo-600 to-sky-500"
        />
        <MetricCard
          title="Orders"
          value={formatMetric(analytics.metrics.orders_total)}
          subtitle={`${formatMetric(analytics.metrics.orders_today)} placed today`}
          icon={ShoppingBag}
          accent="bg-gradient-to-r from-emerald-600 to-teal-500"
        />
        <MetricCard
          title="Open Reports"
          value={formatMetric(analytics.metrics.reports_open)}
          subtitle="Pending or investigating"
          icon={ShieldCheck}
          accent="bg-gradient-to-r from-amber-500 to-orange-500"
        />
        <MetricCard
          title="Approval Backlog"
          value={formatMetric(analytics.metrics.approval_backlog)}
          subtitle={`${formatMetric(analytics.metrics.blocked_users)} blocked users across the platform`}
          icon={Clock3}
          accent="bg-gradient-to-r from-slate-800 to-slate-600"
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.7fr)_380px]">
        <div className="space-y-6">
          <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_20px_45px_-28px_rgba(15,23,42,0.35)] md:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black tracking-tight text-slate-900">7-Day Platform Movement</h3>
                <p className="mt-1 text-sm text-slate-500">Registrations, orders, and reports on the same timeline.</p>
              </div>
            </div>
            <div className="mt-6 h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="usersFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.26} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="ordersFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12, fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 700 }} />
                  <Tooltip contentStyle={{ borderRadius: 18, border: "1px solid #e2e8f0", boxShadow: "0 14px 30px rgba(15,23,42,0.08)" }} />
                  <Area type="monotone" dataKey="users" stroke="#4f46e5" strokeWidth={3} fill="url(#usersFill)" />
                  <Area type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={3} fill="url(#ordersFill)" />
                  <Area type="monotone" dataKey="reports" stroke="#f59e0b" strokeWidth={2.5} fill="transparent" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_20px_45px_-28px_rgba(15,23,42,0.35)] md:p-6">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-slate-900">User Mix</h3>
                  <p className="text-sm text-slate-500">Who is driving the platform right now.</p>
                </div>
              </div>
              <div className="mt-6 h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={analytics.user_mix} dataKey="value" nameKey="name" innerRadius={56} outerRadius={92} paddingAngle={3}>
                      {analytics.user_mix.map((entry, index) => (
                        <Cell key={entry.name} fill={userMixColors[index % userMixColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 space-y-2">
                {analytics.user_mix.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: userMixColors[index % userMixColors.length] }} />
                      <span className="text-sm font-semibold text-slate-700">{item.name}</span>
                    </div>
                    <span className="text-sm font-black text-slate-900">{formatMetric(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_20px_45px_-28px_rgba(15,23,42,0.35)] md:p-6">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <BarChart3 size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-slate-900">Order Status Mix</h3>
                  <p className="text-sm text-slate-500">Where the order pipeline is bunching up.</p>
                </div>
              </div>
              <div className="mt-6 h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={analytics.order_status} dataKey="value" nameKey="name" outerRadius={96}>
                      {analytics.order_status.map((entry, index) => (
                        <Cell key={entry.name} fill={orderStatusColors[index % orderStatusColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_20px_45px_-28px_rgba(15,23,42,0.35)] md:p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-50 text-orange-600">
                <Building2 size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight text-slate-900">Moderation Pipeline</h3>
                <p className="text-sm text-slate-500">Pending, approved, and rejected across the three review queues.</p>
              </div>
            </div>
            <div className="mt-6 h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.moderation_pipeline} barGap={10}>
                  <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12, fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 700 }} />
                  <Tooltip />
                  <Bar dataKey="pending" radius={[8, 8, 0, 0]} fill="#f59e0b" />
                  <Bar dataKey="approved" radius={[8, 8, 0, 0]} fill="#10b981" />
                  <Bar dataKey="rejected" radius={[8, 8, 0, 0]} fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <section className="rounded-[30px] border border-slate-200 bg-[#111827] p-6 text-white shadow-[0_20px_45px_-24px_rgba(15,23,42,0.5)]">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-indigo-200">Operational Focus</p>
            <h3 className="mt-3 text-2xl font-black tracking-tight">What needs attention now</h3>
            <div className="mt-6 space-y-3">
              <InsightRow
                icon={AlertTriangle}
                title="Open reports"
                value={formatMetric(analytics.metrics.reports_open)}
                note="Potential trust and safety issues still active."
                tone="amber"
              />
              <InsightRow
                icon={Bike}
                title="Live delivery load"
                value={formatMetric(analytics.metrics.delivery_orders_active)}
                note="Orders waiting in ready or out-for-delivery states."
                tone="emerald"
              />
              <InsightRow
                icon={Store}
                title="Approval backlog"
                value={formatMetric(analytics.metrics.approval_backlog)}
                note="Queues that still need moderator review."
                tone="indigo"
              />
            </div>
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_20px_45px_-28px_rgba(15,23,42,0.35)]">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Store size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight text-slate-900">Top Restaurants</h3>
                <p className="text-sm text-slate-500">Most food orders handled.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {analytics.top_restaurants.length ? analytics.top_restaurants.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{index + 1}. {item.name}</p>
                    <p className="text-xs text-slate-500">Order activity leaderboard</p>
                  </div>
                  <span className="text-base font-black text-slate-900">{formatMetric(item.orders)}</span>
                </div>
              )) : (
                <p className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">No restaurant order activity yet.</p>
              )}
            </div>
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_20px_45px_-28px_rgba(15,23,42,0.35)]">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight text-slate-900">Recent Admin Actions</h3>
                <p className="text-sm text-slate-500">Latest moderation and management changes.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {analytics.recent_admin_actions.length ? analytics.recent_admin_actions.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-slate-900">{item.action}</p>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 ring-1 ring-slate-200">
                      {item.target_type}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{item.admin__username} • {new Date(item.created_at).toLocaleString()}</p>
                </div>
              )) : (
                <p className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">No recent admin actions yet.</p>
              )}
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
