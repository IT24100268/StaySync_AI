import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Building,
  Check,
  ChevronRight,
  Clock3,
  ShieldAlert,
  ShoppingBag,
  Truck,
  Users,
  UtensilsCrossed,
  XCircle,
  SearchX,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "../../services/api";

const ROOM_OWNER_FALLBACK =
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&q=80";
const RESTAURANT_FALLBACK =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&q=80";

function roomBelongsToUser(room, user) {
  const ownerContact = String(room?.owner_contact || "").trim().toLowerCase();
  const ownerUsername = String(room?.owner_username || "").trim().toLowerCase();
  const username = String(user?.username || "").trim().toLowerCase();
  const email = String(user?.email || "").trim().toLowerCase();
  const phone = String(user?.profile?.phone_number || "").trim().toLowerCase();

  return (
    (ownerUsername && username === ownerUsername) ||
    (ownerContact && (email === ownerContact || phone === ownerContact)) ||
    (ownerContact && email.startsWith(ownerContact)) ||
    (ownerContact && phone.startsWith(ownerContact))
  );
}

function getPrimaryOwnerRoom(user, rooms) {
  const matched = rooms.filter((room) => roomBelongsToUser(room, user));
  if (matched.length === 0) return null;

  const statusRank = {
    PENDING: 0,
    APPROVED: 1,
    NEEDS_CHANGES: 2,
    REJECTED: 3,
    SUSPENDED: 4,
  };

  return [...matched].sort((a, b) => {
    const rankDiff = (statusRank[a.status] ?? 99) - (statusRank[b.status] ?? 99);
    if (rankDiff !== 0) return rankDiff;
    return (b.id || 0) - (a.id || 0);
  })[0];
}

export default function AdminHome2() {
  const [stats, setStats] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [pendingHostelOwners, setPendingHostelOwners] = useState([]);
  const [approvedHostelOwners, setApprovedHostelOwners] = useState([]);
  const [pendingRestaurantOwners, setPendingRestaurantOwners] = useState([]);
  const [approvedRestaurantOwners, setApprovedRestaurantOwners] = useState([]);
  const [partners, setPartners] = useState([]);
  const [reports, setReports] = useState([]);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sumRes, analyticsRes, roomsRes, pendingOwnersRes, approvedOwnersRes, pendingRestaurantOwnersRes, approvedRestaurantOwnersRes, partRes, repRes] = await Promise.all([
        api.get("/admin/analytics/summary/"),
        api.get("/admin/analytics/detail/"),
        api.get("/admin/rooms/"),
        api.get("/admin/users/?is_approved=false&user_type=hostel_owner"),
        api.get("/admin/users/?is_approved=true&user_type=hostel_owner"),
        api.get("/admin/users/?is_approved=false&user_type=restaurant_owner"),
        api.get("/admin/users/?is_approved=true&user_type=restaurant_owner"),
        api.get("/admin/partners/"),
        api.get("/admin/reports/"),
      ]);
      setStats(sumRes.data);
      setTrend(analyticsRes.data?.trend || []);
      setRooms(roomsRes.data?.results || roomsRes.data || []);
      setPendingHostelOwners(pendingOwnersRes.data?.results || pendingOwnersRes.data || []);
      setApprovedHostelOwners(approvedOwnersRes.data?.results || approvedOwnersRes.data || []);
      setPendingRestaurantOwners(pendingRestaurantOwnersRes.data?.results || pendingRestaurantOwnersRes.data || []);
      setApprovedRestaurantOwners(approvedRestaurantOwnersRes.data?.results?.slice(0, 2) || approvedRestaurantOwnersRes.data?.slice(0, 2) || []);
      setPartners(partRes.data?.results?.slice(0, 2) || partRes.data?.slice(0, 2) || []);
      setReports(repRes.data?.results?.slice(0, 3) || repRes.data?.slice(0, 3) || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (type, id, action) => {
    try {
      const status = action === "approve" ? "APPROVED" : "REJECTED";
      let endpoint = "";
      if (type === "room") endpoint = `/admin/rooms/${id}/update_status/`;
      if (type === "restaurant") endpoint = `/admin/restaurants/${id}/update_status/`;
      if (type === "partner") endpoint = `/admin/partners/${id}/update_status/`;
      await api.patch(endpoint, { status, review_note: `Dashboard fast ${action}` });
      fetchData();
    } catch (error) {
      console.error(`Failed to ${action} ${type}`, error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-300 border-t-violet-700 shadow-lg shadow-violet-300/40" />
      </div>
    );
  }

  const totalUsers7d = trend.reduce((sum, item) => sum + (item.users || 0), 0);
  const totalOrders7d = trend.reduce((sum, item) => sum + (item.orders || 0), 0);
  const totalReports7d = trend.reduce((sum, item) => sum + (item.reports || 0), 0);
  const peakDay = trend.reduce((best, item) => {
    const currentLoad = (item.users || 0) + (item.orders || 0) + (item.reports || 0);
    const bestLoad = (best?.users || 0) + (best?.orders || 0) + (best?.reports || 0);
    return currentLoad > bestLoad ? item : best;
  }, trend[0] || null);

  const prioritizedHostelOwners = [
    ...pendingHostelOwners.map((user) => ({ ...user, moderationType: "pending" })),
    ...approvedHostelOwners.map((user) => ({ ...user, moderationType: "approved" })),
  ].slice(0, 2);

  const prioritizedRestaurantUsers = [
    ...pendingRestaurantOwners.map((owner) => ({
      id: `pending-${owner.id}`,
      image: owner.profile?.display_image || RESTAURANT_FALLBACK,
      title: owner.profile?.restaurant_name || owner.username || `Restaurant ${owner.id}`,
      owner: owner.username || "Under review",
      phone: owner.profile?.phone_number || owner.email || "No contact",
      status: "PENDING",
    })),
    ...approvedRestaurantOwners.map((owner) => ({
      id: `approved-${owner.id}`,
      image: owner.profile?.display_image || RESTAURANT_FALLBACK,
      title: owner.profile?.restaurant_name || owner.username || `Restaurant ${owner.id}`,
      owner: owner.username || "Not shared",
      phone: owner.profile?.phone_number || owner.email || "No contact",
      status: "APPROVED",
    })),
  ].slice(0, 2);

  return (
    <div className="mx-auto max-w-[1480px] space-y-8 pb-10">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <TopStat link="/admin/users" title="Verified Users" value={stats?.total_users || 0} icon={Users} bg="#24143d" accent="from-violet-400 to-fuchsia-400" note="Student, hostel, restaurant, and delivery accounts" />
        <TopStat link="/admin/reports" title="Pending Reports" value={stats?.pending_reports || 0} icon={ShieldAlert} bg="#311642" accent="from-rose-400 to-violet-400" note="Safety issues waiting for admin review" />
        <TopStat link="/admin/orders" title="Today's Orders" value={stats?.total_orders_today || 0} icon={ShoppingBag} bg="#1e234a" accent="from-cyan-300 to-violet-400" note="Fresh restaurant activity moving through the day" />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.7fr_0.9fr]">
        <div className="space-y-8">
          <section className="rounded-[30px] border border-violet-200/50 bg-white/80 p-6 shadow-[0_25px_60px_-32px_rgba(139,92,246,0.45)] backdrop-blur">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-500">Moderation Flow</p>
                <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Platform Overview</h3>
                <p className="mt-1 text-sm text-slate-500">Review the most important approval queues without losing visual clarity.</p>
              </div>
              <Link
                to="/admin/rooms"
                className="inline-flex min-w-[132px] items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-extrabold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5"
                style={{
                  background: "#24143d",
                  color: "#ffffff",
                  border: "1px solid #120c22",
                  boxShadow: "0 22px 40px -18px rgba(24,12,44,0.98)",
                }}
              >
                View
                <ChevronRight size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <PanelCard title="Room Approvals" icon={Building} iconTone="bg-violet-100 text-violet-700">
                <div className="space-y-3 min-h-[160px]">
                  {prioritizedHostelOwners.length === 0 ? (
                    <EmptyState message="No hostel owners in the queue." icon={Building} />
                  ) : (
                    prioritizedHostelOwners.map((owner) => {
                      const primaryRoom = getPrimaryOwnerRoom(owner, rooms);
                      return (
                        <HostelOwnerDashboardItem
                          key={owner.id}
                          image={owner.profile?.display_image || primaryRoom?.owner_display_image || ROOM_OWNER_FALLBACK}
                          title={owner.profile?.hostel_name || owner.username || `Owner ${owner.id}`}
                          phone={owner.profile?.phone_number || "No phone"}
                          status={owner.moderationType === "pending" ? "PENDING" : "APPROVED"}
                        />
                      );
                    })
                  )}
                </div>
              </PanelCard>

              <PanelCard title="Restaurant Approvals" icon={UtensilsCrossed} iconTone="bg-fuchsia-100 text-fuchsia-700">
                <div className="space-y-4 min-h-[190px]">
                  {prioritizedRestaurantUsers.length === 0 ? (
                    <EmptyState message="No restaurant users yet." icon={UtensilsCrossed} />
                  ) : (
                    prioritizedRestaurantUsers.map((restaurantUser) => (
                      <ApprovedRestaurantDashboardItem
                        key={restaurantUser.id}
                        image={restaurantUser.image}
                        title={restaurantUser.title}
                        owner={restaurantUser.owner}
                        phone={restaurantUser.phone}
                        status={restaurantUser.status}
                      />
                    ))
                  )}
                </div>
              </PanelCard>

              <PanelCard title="Partner Approvals" icon={Truck} iconTone="bg-cyan-100 text-cyan-700" className="md:col-span-2">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {partners.length === 0 ? (
                    <EmptyState message="No delivery partners pending." icon={Truck} cols="col-span-2 min-h-[120px]" />
                  ) : (
                    partners.map((partner) => (
                      <ApprovalItem
                        key={partner.id}
                        image={partner.partner_display_image || partner.user?.profile_picture || `https://ui-avatars.com/api/?name=${partner.username || "P"}&background=EDE9FE&color=4C1D95`}
                        title={partner.username || partner.user?.username || `Partner ${partner.id}`}
                        subtitle={partner.vehicle_type ? partner.vehicle_type.toUpperCase() : "DELIVERY AGENT"}
                        status={partner.status}
                        onApprove={() => handleAction("partner", partner.id, "approve")}
                        onReject={() => handleAction("partner", partner.id, "reject")}
                      />
                    ))
                  )}
                </div>
              </PanelCard>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="rounded-[30px] border border-violet-200/50 bg-white/80 p-6 shadow-[0_25px_60px_-32px_rgba(139,92,246,0.45)] backdrop-blur">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-500">Activity</p>
                <h3 className="mt-2 text-xl font-black tracking-tight text-slate-900">Live Platform Activity</h3>
                <p className="mt-1 text-sm text-slate-500">Real platform movement for users, food orders, and reports across the last 7 days.</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
                <Clock3 size={12} />
                Last 7 Days
              </div>
            </div>
            <div className="mb-5 grid grid-cols-3 gap-3">
              <MiniMetric title="New Users" value={totalUsers7d} tone="violet" />
              <MiniMetric title="Orders" value={totalOrders7d} tone="indigo" />
              <MiniMetric title="Reports" value={totalReports7d} tone="rose" />
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 10, right: 0, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ordersFillDashboard" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4338ca" stopOpacity={0.34} />
                      <stop offset="95%" stopColor="#4338ca" stopOpacity={0.03} />
                    </linearGradient>
                    <linearGradient id="usersFillDashboard" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.24} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="reportsFillDashboard" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.14} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e9d5ff" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#8b5cf6", fontWeight: 700 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#a78bfa", fontWeight: 700 }} dx={-8} />
                  <Tooltip
                    content={<ActivityTooltip />}
                    cursor={{ stroke: "#8b5cf6", strokeOpacity: 0.2, strokeWidth: 2 }}
                  />
                  <Area type="monotone" dataKey="orders" stroke="#4338ca" strokeWidth={4} fill="url(#ordersFillDashboard)" />
                  <Area type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={3} fill="url(#usersFillDashboard)" />
                  <Area type="monotone" dataKey="reports" stroke="#f43f5e" strokeWidth={2.5} fill="url(#reportsFillDashboard)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
              <LegendPill label="Users" color="#8b5cf6" />
              <LegendPill label="Orders" color="#4338ca" />
              <LegendPill label="Reports" color="#f43f5e" />
              <span className="ml-auto rounded-full bg-slate-100 px-3 py-1 text-[11px] tracking-[0.16em] text-slate-600">
                Peak day: {peakDay?.label || "N/A"}
              </span>
            </div>
          </section>

          <section className="rounded-[30px] border border-violet-200/50 bg-white/80 p-6 shadow-[0_25px_60px_-32px_rgba(139,92,246,0.45)] backdrop-blur">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-500">Watchlist</p>
                <h3 className="mt-2 text-xl font-black tracking-tight text-slate-900">Recent Reports</h3>
                <p className="mt-1 text-sm text-slate-500">Keep risk signals close and easy to act on.</p>
              </div>
              <Link
                to="/admin/reports"
                className="inline-flex min-w-[132px] items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-extrabold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5"
                style={{
                  background: "#24143d",
                  color: "#ffffff",
                  border: "1px solid #120c22",
                  boxShadow: "0 22px 40px -18px rgba(24,12,44,0.98)",
                }}
              >
                View
                <ChevronRight size={16} />
              </Link>
            </div>
            <div className="space-y-4">
              {reports.length === 0 ? (
                <EmptyState message="No recent reports." icon={SearchX} cols="min-h-[170px]" />
              ) : (
                reports.map((report) => (
                  <div key={report.id} className="group flex items-center gap-4 rounded-2xl border border-transparent bg-violet-50/40 p-3 transition hover:border-violet-200 hover:bg-white">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[16px] border border-violet-100 bg-white text-violet-600 shadow-sm transition-transform group-hover:scale-110">
                      <AlertCircle size={22} strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black leading-tight text-slate-900">{report.target_type || "User Report"}</p>
                      <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">{report.reason || "Needs review"}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function MiniMetric({ title, value, tone }) {
  const toneStyles = {
    violet: "border-violet-200 bg-violet-50 text-violet-700",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
  };

  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneStyles[tone] || toneStyles.violet}`}>
      <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] opacity-80">{title}</p>
      <p className="mt-2 text-2xl font-black tracking-tight">{value}</p>
    </div>
  );
}

function LegendPill({ label, color }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-sm">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function ActivityTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const values = Object.fromEntries(payload.map((item) => [item.dataKey, item.value]));

  return (
    <div className="rounded-[18px] border border-violet-100 bg-white/95 p-4 shadow-[0_18px_35px_rgba(139,92,246,0.18)] backdrop-blur">
      <p className="text-sm font-black text-slate-900">{label}</p>
      <div className="mt-3 space-y-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-violet-500" />Users</span>
          <span className="text-slate-900">{values.users || 0}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-indigo-700" />Orders</span>
          <span className="text-slate-900">{values.orders || 0}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" />Reports</span>
          <span className="text-slate-900">{values.reports || 0}</span>
        </div>
      </div>
    </div>
  );
}

function TopStat({ title, value, icon: Icon, link, bg, accent, note }) {
  return (
    <Link
      to={link || "#"}
      className="group relative overflow-hidden rounded-[28px] border p-5 text-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_28px_60px_-28px_rgba(49,22,66,0.95)]"
      style={{
        background: bg,
        borderColor: "#120c22",
        boxShadow: "0 20px 46px -24px rgba(24,12,44,0.92)",
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(167,139,250,0.18),transparent_30%)]" />
        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-90 ${accent}`} />
      </div>

      <div className="relative flex items-start justify-between">
        <div style={{ backgroundColor: "rgba(255,255,255,0.12)" }} className="grid h-14 w-14 place-items-center rounded-[18px] border border-white/15 shadow-inner backdrop-blur">
          <Icon size={24} strokeWidth={2.5} className="text-white" />
        </div>
        <div className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
          Live
        </div>
      </div>

      <div className="relative pt-5">
        <div>
          <p className="text-[13px] font-extrabold uppercase tracking-[0.22em] text-white/84">{title}</p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <h3 className="text-5xl font-black leading-none tracking-[-0.04em] text-white">{value}</h3>
            <div className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/10 text-white transition-all duration-300 group-hover:bg-white group-hover:text-violet-700">
              <ArrowRight size={16} strokeWidth={3} />
            </div>
          </div>
          <p className="mt-3 min-h-[40px] text-[13px] font-medium leading-5 text-white/70">{note}</p>
        </div>

        <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white px-3.5 py-2 text-[12px] font-extrabold text-slate-900 shadow-[0_14px_26px_-18px_rgba(255,255,255,0.62)] transition-all duration-300 group-hover:translate-x-1">
          Open panel
          <ChevronRight size={14} strokeWidth={3} />
        </div>
      </div>
    </Link>
  );
}

function PanelCard({ title, icon: Icon, iconTone, className = "", children }) {
  return (
    <div className={`rounded-[30px] border border-violet-200/50 bg-white/80 p-6 shadow-[0_25px_60px_-32px_rgba(139,92,246,0.45)] backdrop-blur ${className}`}>
      <div className="mb-6 flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${iconTone}`}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
        <h3 className="text-base font-black tracking-tight text-slate-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function ApprovalItem({ image, title, subtitle, status, onApprove, onReject }) {
  return (
    <div className="group rounded-[24px] border border-violet-100/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(245,243,255,0.72))] p-4 shadow-[0_18px_40px_-28px_rgba(139,92,246,0.45)] transition-all duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-[0_24px_48px_-26px_rgba(139,92,246,0.42)]">
      <div className="flex items-center gap-4">
        <div className="relative overflow-hidden rounded-[20px] border border-white/90 bg-violet-50 shadow-[0_12px_28px_-20px_rgba(15,23,42,0.4)]">
          <img src={image} alt={title} className="h-20 w-24 bg-white object-cover transition duration-500 group-hover:scale-105" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-slate-900/12 to-transparent" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[16px] font-black leading-snug text-slate-900">{title}</p>
              <p className="mt-1 truncate text-[12px] font-bold uppercase tracking-[0.14em] text-slate-400">Partner Detail</p>
            </div>
            <span className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] ${status === "APPROVED" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : status === "PENDING" ? "border-violet-200 bg-violet-50 text-violet-700" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
              {status}
            </span>
          </div>
          <div className="mt-3 rounded-2xl border border-violet-100/70 bg-white/90 px-3 py-2.5">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Service</p>
            <p className="truncate text-[13px] font-bold text-slate-900">{subtitle}</p>
          </div>
        </div>
      </div>
      {status === "PENDING" ? (
        <div className="mt-4 flex items-center justify-end gap-2 opacity-100 transition-opacity md:opacity-0 group-hover:opacity-100">
          <button onClick={onApprove} className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-emerald-600 transition-all hover:border-emerald-500 hover:bg-emerald-500 hover:text-white" title="Approve">
            <Check size={18} strokeWidth={3} />
          </button>
          <button onClick={onReject} className="flex h-10 w-10 items-center justify-center rounded-full border border-rose-100 bg-rose-50 text-rose-600 transition-all hover:border-rose-500 hover:bg-rose-500 hover:text-white" title="Reject">
            <XCircle size={18} strokeWidth={2.5} />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function HostelOwnerDashboardItem({ image, title, phone, status }) {
  const statusCls =
    status === "PENDING"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return (
    <div className="group rounded-[24px] border border-violet-100/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(245,243,255,0.72))] p-4 shadow-[0_18px_40px_-28px_rgba(139,92,246,0.45)] transition-all duration-300 hover:-translate-y-1 hover:border-violet-200">
      <div className="flex items-center gap-3">
        <div className="relative overflow-hidden rounded-[20px] border border-white/90 bg-violet-50 shadow-[0_12px_28px_-20px_rgba(15,23,42,0.4)]">
          <img src={image} alt={title} className="h-20 w-24 bg-white object-cover transition duration-500 group-hover:scale-105" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-slate-900/12 to-transparent" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[16px] font-black leading-snug text-slate-900">{title}</p>
              <p className="mt-1 truncate text-[12px] font-bold uppercase tracking-[0.14em] text-slate-400">Room Listing</p>
            </div>
            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${statusCls}`}>
              {status}
            </span>
          </div>
          <div className="mt-3 rounded-2xl border border-violet-100/70 bg-white/90 px-3 py-2.5">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Phone</p>
            <p className="truncate text-[13px] font-bold text-slate-900">{phone}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ApprovedRestaurantDashboardItem({ image, title, owner, phone, status }) {
  return (
    <div className="group rounded-[24px] border border-fuchsia-100/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(253,244,255,0.72))] p-4 shadow-[0_18px_40px_-28px_rgba(217,70,239,0.34)] transition-all duration-300 hover:-translate-y-1 hover:border-fuchsia-200">
      <div className="flex items-center gap-3">
        <div className="relative overflow-hidden rounded-[20px] border border-white/90 bg-fuchsia-50 shadow-[0_12px_28px_-20px_rgba(15,23,42,0.4)]">
          <img src={image} alt={title} className="h-20 w-24 bg-white object-cover transition duration-500 group-hover:scale-105" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-slate-900/12 to-transparent" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[16px] font-black leading-snug text-slate-900">{title}</p>
              <p className="mt-1 truncate text-[12px] font-bold uppercase tracking-[0.14em] text-slate-400">Restaurant Profile</p>
            </div>
            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${status === "APPROVED" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
              {status}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="rounded-2xl border border-fuchsia-100/70 bg-white/90 px-3 py-2.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Owner</p>
              <p className="truncate text-[12px] font-bold text-slate-900">{owner}</p>
            </div>
            <div className="rounded-2xl border border-fuchsia-100/70 bg-white/90 px-3 py-2.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Phone</p>
              <p className="truncate text-[12px] font-bold text-slate-900">{phone}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message, icon: Icon, cols = "h-full" }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-violet-200/70 bg-violet-50/35 p-8 ${cols}`}>
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-100 bg-white text-violet-300 shadow-sm">
        <Icon size={28} strokeWidth={2} />
      </div>
      <p className="text-center text-sm font-semibold tracking-wide text-slate-500">{message}</p>
    </div>
  );
}
