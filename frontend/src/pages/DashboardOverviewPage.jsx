import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Star } from 'lucide-react';
import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import StatusBadge from '../components/StatusBadge';
import { restaurantApi } from '../services/restaurantApi';

const revenueSeries = [
  { day: 'Mon', value: 8200 },
  { day: 'Tue', value: 9400 },
  { day: 'Wed', value: 8800 },
  { day: 'Thu', value: 11600 },
  { day: 'Fri', value: 12900 },
  { day: 'Sat', value: 14100 },
  { day: 'Sun', value: 13700 },
];

const reviewItems = [
  { id: 1, name: 'N. Perera', rating: 5, text: 'Great packaging and fast delivery. Keep this quality!' },
  { id: 2, name: 'A. Silva', rating: 4, text: 'Food was fresh and still warm. Loved the service.' },
  { id: 3, name: 'K. Fernando', rating: 5, text: 'Best rice bowl in town. Ordering again tonight.' },
];

function KpiCard({ label, value, detail, gradient }) {
  return (
    <article className={`rounded-2xl bg-gradient-to-br ${gradient} p-5 shadow-soft`}>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
      <div className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-700">
        <ArrowUpRight size={14} />
        <span>{detail}</span>
      </div>
    </article>
  );
}

function OrderCustomer({ order }) {
  const label = order.student_name || `Customer ${order.student}`;
  const initials = label
    .split(' ')
    .slice(0, 2)
    .map((segment) => segment[0])
    .join('')
    .toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <div className="grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">{initials}</div>
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </div>
  );
}

export default function DashboardOverviewPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const response = await restaurantApi.getDashboardOverview();
        setData(response.data);
      } catch {
        setError('Failed to load dashboard overview.');
      }
    };

    fetchOverview();
  }, []);

  const statusData = useMemo(() => {
    const orderCounts = {};
    (data?.recent_orders || []).forEach((order) => {
      orderCounts[order.status] = (orderCounts[order.status] || 0) + 1;
    });
    const palette = ['#f59e0b', '#3b82f6', '#22c55e', '#8b5cf6', '#10b981'];
    return Object.entries(orderCounts).map(([status, count], index) => ({
      name: status.replaceAll('_', ' '),
      value: count,
      color: palette[index % palette.length],
    }));
  }, [data]);

  if (error) {
    return <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{error}</div>;
  }

  if (!data) {
    return <div className="rounded-2xl bg-white p-6 text-sm text-slate-500 shadow-sm">Loading dashboard metrics...</div>;
  }

  const kpis = [
    {
      label: "Today's Orders",
      value: data.todays_orders_count,
      detail: '+8.4% from yesterday',
      gradient: 'from-emerald-50 to-white',
    },
    {
      label: 'Revenue (LKR)',
      value: `LKR ${Number(data.total_revenue).toLocaleString()}`,
      detail: '+12.1% weekly growth',
      gradient: 'from-sky-50 to-white',
    },
    {
      label: 'Active Orders',
      value: data.active_orders,
      detail: '+3 live now',
      gradient: 'from-violet-50 to-white',
    },
    {
      label: 'Ratings',
      value: `${data.ratings} / 5`,
      detail: 'Based on 0 reviews',
      gradient: 'from-amber-50 to-white',
    },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-slate-900">Recent Orders</h3>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                {data.recent_orders.length} new orders
              </span>
            </div>
            <button type="button" className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              View All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-2 py-3">Order ID</th>
                  <th className="px-2 py-3">Customer</th>
                  <th className="px-2 py-3">Items</th>
                  <th className="px-2 py-3">Total</th>
                  <th className="px-2 py-3">Status</th>
                  <th className="px-2 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_orders.length ? (
                  data.recent_orders.map((order) => (
                    <tr key={order.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-2 py-3 text-sm font-semibold text-slate-700">#{order.id}</td>
                      <td className="px-2 py-3">
                        <OrderCustomer order={order} />
                      </td>
                      <td className="px-2 py-3 text-sm text-slate-600">{order.items?.length || 0} items</td>
                      <td className="px-2 py-3 text-sm font-medium text-slate-700">LKR {Number(order.total_amount).toLocaleString()}</td>
                      <td className="px-2 py-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-2 py-3">
                        <button type="button" className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200">
                          Track
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-2 py-6 text-center text-sm text-slate-500">
                      No orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">Revenue Trend</h3>
            <div className="mt-4 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueSeries}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#0f766e" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">Order Status</h3>
            <div className="mt-4 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" innerRadius={55} outerRadius={78} paddingAngle={4}>
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-2">
              {statusData.map((entry) => (
                <div key={entry.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-slate-600">{entry.name}</span>
                  </div>
                  <span className="font-semibold text-slate-700">{entry.value}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">Customer Reviews</h3>
            <div className="mt-4 space-y-4">
              {reviewItems.map((review) => (
                <article key={review.id} className="rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">{review.name}</p>
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star size={14} fill="currentColor" />
                      <span className="text-xs font-semibold">{review.rating}.0</span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-600">{review.text}</p>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
