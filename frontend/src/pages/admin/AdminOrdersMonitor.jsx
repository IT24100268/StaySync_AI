import { useEffect, useMemo, useState } from "react";
import {
  Bike,
  Home,
  MapPin,
  PackageCheck,
  Search,
  ShoppingBag,
  Store,
  UserRound,
} from "lucide-react";
import api from "../../services/api";

const statusToneMap = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  accepted: "bg-sky-50 text-sky-700 border-sky-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
  preparing: "bg-indigo-50 text-indigo-700 border-indigo-200",
  ready: "bg-violet-50 text-violet-700 border-violet-200",
  out_for_delivery: "bg-emerald-50 text-emerald-700 border-emerald-200",
  delivered: "bg-slate-100 text-slate-700 border-slate-200",
};

const statusLabelMap = {
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Rejected",
  preparing: "Preparing",
  ready: "Ready",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
};

const currency = (value) => `LKR ${Number(value || 0).toLocaleString()}`;

const timeAgo = (dateValue) => {
  const date = new Date(dateValue);
  const diffMinutes = Math.max(1, Math.floor((Date.now() - date.getTime()) / 60000));
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;
  return `${Math.floor(diffHours / 24)} day${Math.floor(diffHours / 24) > 1 ? "s" : ""} ago`;
};

function SummaryCard({ title, value, subtitle, icon: Icon, tone = "indigo" }) {
  const toneMap = {
    indigo: "from-indigo-600 via-indigo-500 to-sky-500",
    orange: "from-orange-500 via-amber-500 to-yellow-400",
    emerald: "from-emerald-600 via-emerald-500 to-teal-400",
    slate: "from-slate-700 via-slate-600 to-slate-500",
  };

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-white px-5 py-5 shadow-[0_20px_45px_-24px_rgba(15,23,42,0.35)]">
      <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${toneMap[tone] || toneMap.indigo}`} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">{title}</p>
          <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-900">{value}</h3>
          <p className="mt-2 text-sm font-medium text-slate-500">{subtitle}</p>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/10">
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function FilterChip({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full border px-4 py-2 text-sm font-semibold transition-all",
        active
          ? "border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/10"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function StatusPill({ status }) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusToneMap[status] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
      {statusLabelMap[status] || status}
    </span>
  );
}

export default function AdminOrdersMonitor() {
  const [data, setData] = useState({ summary: null, orders: [] });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const response = await api.get("/admin/orders/monitor/");
        setData({
          summary: response.data?.summary || null,
          orders: response.data?.orders || [],
        });
      } catch (error) {
        console.error("Failed to load admin orders monitor", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    return (data.orders || []).filter((order) => {
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      const matchesType = typeFilter === "all" || order.order_type === typeFilter;
      const search = searchText.trim().toLowerCase();
      const matchesSearch =
        !search ||
        [
          order.student_name,
          order.student_email,
          order.restaurant_name,
          order.delivery_partner_name,
          order.room_context?.room_title,
          order.delivery_address,
          ...(order.items_preview || []).map((item) => item.name),
          `#${order.id}`,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));

      return matchesStatus && matchesType && matchesSearch;
    });
  }, [data.orders, searchText, statusFilter, typeFilter]);

  const activeDeliveries = useMemo(
    () => filteredOrders.filter((order) => order.status === "out_for_delivery"),
    [filteredOrders]
  );
  const missingRoomContext = useMemo(
    () => filteredOrders.filter((order) => !order.room_context),
    [filteredOrders]
  );

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
        <SummaryCard
          title="Total Visible"
          value={data.summary?.total_orders || 0}
          subtitle={`${data.summary?.today_orders || 0} placed today`}
          icon={ShoppingBag}
          tone="indigo"
        />
        <SummaryCard
          title="Delivery Orders"
          value={data.summary?.delivery_orders || 0}
          subtitle={`${data.summary?.assigned_delivery_partners || 0} assigned to riders`}
          icon={Bike}
          tone="emerald"
        />
        <SummaryCard
          title="Takeaway Orders"
          value={data.summary?.takeaway_orders || 0}
          subtitle="Quick pickup flow"
          icon={PackageCheck}
          tone="orange"
        />
        <SummaryCard
          title="Room Linked"
          value={data.summary?.with_room_context || 0}
          subtitle={`${(data.summary?.total_orders || 0) - (data.summary?.with_room_context || 0)} without hostel match`}
          icon={Home}
          tone="slate"
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.8fr)_360px]">
        <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_20px_45px_-28px_rgba(15,23,42,0.35)] md:p-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-xl font-black tracking-tight text-slate-900">Orders Monitor</h3>
                <p className="mt-1 text-sm text-slate-500">Readable, filterable, and built for quick admin decisions.</p>
              </div>
              <div className="relative w-full lg:max-w-sm">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search by order, student, restaurant, room..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                {[
                  ["all", "All statuses"],
                  ["pending", "Pending"],
                  ["preparing", "Preparing"],
                  ["ready", "Ready"],
                  ["out_for_delivery", "Out for delivery"],
                  ["delivered", "Delivered"],
                ].map(([value, label]) => (
                  <FilterChip key={value} active={statusFilter === value} label={label} onClick={() => setStatusFilter(value)} />
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  ["all", "All types"],
                  ["delivery", "Delivery"],
                  ["takeaway", "Takeaway"],
                ].map(([value, label]) => (
                  <FilterChip key={value} active={typeFilter === value} label={label} onClick={() => setTypeFilter(value)} />
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-[26px] border border-slate-200">
              <div className="grid grid-cols-[96px_minmax(0,1.25fr)_minmax(0,1.05fr)_minmax(0,1fr)_120px] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                <span>Order</span>
                <span>Restaurant & Items</span>
                <span>Student & Hostel</span>
                <span>Delivery</span>
                <span>Status</span>
              </div>

              <div className="divide-y divide-slate-100">
                {filteredOrders.length === 0 ? (
                  <div className="px-6 py-16 text-center">
                    <p className="text-base font-semibold text-slate-700">No orders match the current filters.</p>
                    <p className="mt-2 text-sm text-slate-500">Try clearing the status or search filters to widen the monitor.</p>
                  </div>
                ) : (
                  filteredOrders.map((order) => (
                    <article
                      key={order.id}
                      className="grid grid-cols-1 gap-4 px-4 py-5 transition hover:bg-slate-50/80 md:grid-cols-[96px_minmax(0,1.25fr)_minmax(0,1.05fr)_minmax(0,1fr)_120px]"
                    >
                      <div>
                        <p className="text-sm font-black text-slate-900">#{order.id}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">{timeAgo(order.created_at)}</p>
                        <p className="mt-3 text-sm font-bold text-slate-700">{currency(order.total_price)}</p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 grid h-10 w-10 place-items-center rounded-2xl bg-orange-50 text-orange-600">
                            <Store size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-slate-900">{order.restaurant_name}</p>
                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{order.restaurant_address}</p>
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 px-3 py-3">
                          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                            {order.order_type} • {order.items_count} item{order.items_count === 1 ? "" : "s"}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {(order.items_preview || []).map((item, index) => (
                              <span key={`${order.id}-${item.name}-${index}`} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                                {item.quantity}x {item.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 grid h-10 w-10 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
                            <UserRound size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-slate-900">{order.student_name}</p>
                            <p className="truncate text-xs text-slate-500">{order.student_email}</p>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-3 py-3">
                          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Room / Hostel</p>
                          {order.room_context ? (
                            <div className="mt-2 space-y-1.5">
                              <p className="text-sm font-semibold text-slate-800">{order.room_context.room_title}</p>
                              <p className="line-clamp-2 text-xs leading-5 text-slate-500">{order.room_context.room_address || "Address not available"}</p>
                            </div>
                          ) : (
                            <p className="mt-2 text-sm text-slate-500">No approved room booking linked yet.</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="rounded-2xl bg-emerald-50/60 px-3 py-3">
                          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">Delivery Partner</p>
                          {order.delivery_partner_name ? (
                            <>
                              <p className="mt-2 text-sm font-semibold text-slate-800">{order.delivery_partner_name}</p>
                              <p className="text-xs text-slate-500">{order.delivery_partner_email}</p>
                            </>
                          ) : (
                            <p className="mt-2 text-sm text-slate-500">
                              {order.order_type === "delivery" ? "Waiting for assignment" : "Not needed for takeaway"}
                            </p>
                          )}
                        </div>

                        <div className="rounded-2xl bg-slate-50 px-3 py-3">
                          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Drop Address</p>
                          <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-500">{order.delivery_address}</p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <StatusPill status={order.status} />
                        <div className="rounded-2xl bg-slate-50 px-3 py-3 text-xs text-slate-500">
                          <p>Food: {currency(order.food_price)}</p>
                          <p className="mt-1">Delivery: {currency(order.delivery_charge)}</p>
                          {order.estimated_delivery_time ? (
                            <p className="mt-1">ETA: {order.estimated_delivery_time} mins</p>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <section className="rounded-[30px] border border-slate-200 bg-[#131a2e] p-6 text-white shadow-[0_20px_45px_-24px_rgba(15,23,42,0.5)]">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-indigo-200">Live Snapshot</p>
            <h3 className="mt-3 text-2xl font-black tracking-tight">Operations at a glance</h3>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-300">Out for delivery</p>
                <p className="mt-2 text-3xl font-black">{activeDeliveries.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-300">Missing room context</p>
                <p className="mt-2 text-3xl font-black">{missingRoomContext.length}</p>
              </div>
            </div>
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_20px_45px_-28px_rgba(15,23,42,0.35)]">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
                <MapPin size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight text-slate-900">Needs Attention</h3>
                <p className="text-sm text-slate-500">Small list, high signal.</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {filteredOrders.slice(0, 5).map((order) => (
                <div key={`focus-${order.id}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">
                        #{order.id} • {order.restaurant_name}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-500">{order.student_name}</p>
                    </div>
                    <StatusPill status={order.status} />
                  </div>
                  <p className="mt-3 text-xs leading-5 text-slate-500">
                    {!order.room_context
                      ? "Student room or hostel context is still missing."
                      : order.order_type === "delivery" && !order.delivery_partner_name
                        ? "Delivery order has not been assigned to a partner yet."
                        : "Order context looks complete and trackable."}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
