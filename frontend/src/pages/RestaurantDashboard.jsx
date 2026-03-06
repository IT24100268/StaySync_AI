import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, MoreHorizontal, Star } from 'lucide-react';
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import MenuItemModal from '../components/menu/MenuItemModal';
import MenuItemsSection from '../components/menu/MenuItemsSection';
import { useFoodItems } from '../context/FoodItemsContext';
import { useToast } from '../context/ToastContext';

const revenueSeries = [
  { time: '8AM', value: 6500 },
  { time: '10AM', value: 9500 },
  { time: '12PM', value: 11000 },
  { time: '2PM', value: 16500 },
  { time: '4PM', value: 26000 },
  { time: '6PM', value: 24000 },
  { time: '8PM', value: 27500 },
];

const reviewItems = [
  { id: 1, name: 'N. Perera', rating: 5, text: 'Great packaging and fast delivery. Keep this quality!' },
  { id: 2, name: 'A. Silva', rating: 4, text: 'Food was fresh and still warm. Loved the service.' },
  { id: 3, name: 'K. Fernando', rating: 5, text: 'Best rice bowl in town. Ordering again tonight.' },
];

function KpiCard({ label, value, detail, gradient }) {
  return (
    <article className={`rounded-2xl bg-gradient-to-br ${gradient} p-5 shadow-sm border border-slate-100`}>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
      <div className="mt-2 flex items-center gap-1 text-xs font-medium text-blue-700">
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
      <div className="grid h-8 w-8 place-items-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">{initials}</div>
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </div>
  );
}

export default function RestaurantDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [prepTime, setPrepTime] = useState('');
  const { items, loading: itemsLoading, error: itemsError, createItem, updateItem, deleteItem, toggleAvailability } = useFoodItems();
  const { addToast } = useToast();

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        console.log('Fetching restaurant orders...');
        // Fetch orders from new endpoint
        const ordersResponse = await api.get('/orders/restaurant/orders/');
        console.log('Orders response:', ordersResponse.data);
        const orders = Array.isArray(ordersResponse.data) ? ordersResponse.data : (ordersResponse.data.results || []);
        console.log('Orders array:', orders);
        
        // Calculate stats
        const todays_orders_count = orders.filter(o => {
          const today = new Date().toDateString();
          return new Date(o.created_at).toDateString() === today;
        }).length;
        
        const total_revenue = orders
          .filter(o => o.status === 'delivered')
          .reduce((sum, o) => sum + Number(o.total_price || 0), 0);
        
        const active_orders = orders.filter(o => 
          ['pending', 'accepted', 'preparing', 'ready'].includes(o.status)
        ).length;
        
        setData({
          todays_orders_count,
          total_revenue,
          active_orders,
          ratings: 4.8,
          recent_orders: orders.slice(0, 10)
        });
      } catch (err) {
        console.error('Failed to load orders:', err);
        console.error('Error details:', err.response?.data);
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
    const palette = ['#f59e0b', '#3b82f6', '#22c55e', '#8b5cf6', '#ef4444'];
    return Object.entries(orderCounts).map(([status, count], index) => ({
      name: status.replaceAll('_', ' '),
      value: count,
      color: palette[index % palette.length],
    }));
  }, [data]);

  const kpis = data
    ? [
        { label: "Today's Orders", value: data.todays_orders_count, detail: '+8.4% from yesterday', gradient: 'from-blue-50 to-white' },
        { label: 'Revenue (LKR)', value: `LKR ${Number(data.total_revenue).toLocaleString()}`, detail: '+12.1% weekly growth', gradient: 'from-slate-50 to-white' },
        { label: 'Active Orders', value: data.active_orders, detail: '+3 live now', gradient: 'from-violet-50 to-white' },
        { label: 'Ratings', value: `${data.ratings} / 5`, detail: 'Based on 0 reviews', gradient: 'from-amber-50 to-white' },
      ]
    : [];

  const openAddModal = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleSave = async (payload) => {
    if (editingItem) {
      await updateItem(editingItem.id, payload);
      addToast({ title: 'Item updated', message: `${editingItem.name} saved successfully.`, variant: 'success' });
    } else {
      await createItem(payload);
      addToast({ title: 'Item added', message: 'New menu item added to your dashboard.', variant: 'success' });
    }
    setEditingItem(null);
  };

  const handleDelete = async (item) => {
    if (!item?.name) {
      addToast({ title: 'Error', message: 'Invalid item selected.', variant: 'error' });
      return;
    }
    const confirmed = window.confirm(`Delete ${item.name}? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await deleteItem(item.id);
      addToast({ title: 'Item deleted', message: `${item.name} removed from the menu.`, variant: 'success' });
    } catch {
      addToast({ title: 'Error', message: 'Failed to delete item.', variant: 'error' });
    }
  };

  const handleToggle = async (item) => {
    if (!item?.name) {
      addToast({ title: 'Error', message: 'Invalid item selected.', variant: 'error' });
      return;
    }
    if (!window.confirm(`Mark ${item.name} as ${item.is_available ? 'out of stock' : 'available'}?`)) return;

    try {
      await toggleAvailability(item.id);
      addToast({
        title: 'Availability updated',
        message: `${item.name} is now ${item.is_available ? 'out of stock' : 'available'}.`,
        variant: 'info',
      });
    } catch {
      addToast({ title: 'Error', message: 'Failed to update availability.', variant: 'error' });
    }
  };

  const handleAcceptOrder = (order) => {
    // If takeaway, accept immediately without prep time
    if (order.order_type === 'takeaway') {
      acceptOrderDirectly(order);
    } else {
      // If delivery, ask for prep time
      setSelectedOrder(order);
      setAcceptModalOpen(true);
    }
  };

  const acceptOrderDirectly = async (order) => {
    try {
      await api.post(`/orders/restaurant/${order.id}/accept/`, { preparation_time: 0 });
      addToast({ 
        title: 'Order Accepted', 
        message: `Takeaway order #${order.id} accepted.`, 
        variant: 'success' 
      });
      // Refresh orders
      const ordersResponse = await api.get('/orders/restaurant/orders/');
      const orders = ordersResponse.data.results || [];
      setData(prev => ({ ...prev, recent_orders: orders.slice(0, 10) }));
    } catch (err) {
      console.error('Accept error:', err);
      addToast({ title: 'Error', message: 'Failed to accept order.', variant: 'error' });
    }
  };

  const handleRejectOrder = async (order) => {
    const reason = prompt('Reason for rejection (optional):');
    if (reason === null) return;

    try {
      await api.post(`/orders/restaurant/${order.id}/reject/`, { reason });
      addToast({ title: 'Order Rejected', message: `Order #${order.id} has been rejected.`, variant: 'info' });
      // Refresh orders
      const ordersResponse = await api.get('/orders/restaurant/orders/');
      const orders = ordersResponse.data.results || [];
      setData(prev => ({ ...prev, recent_orders: orders.slice(0, 10) }));
    } catch (err) {
      console.error('Reject error:', err);
      addToast({ title: 'Error', message: 'Failed to reject order.', variant: 'error' });
    }
  };

  const confirmAcceptOrder = async () => {
    if (!prepTime || prepTime < 1) {
      alert('Please enter preparation time (minimum 1 minute)');
      return;
    }

    try {
      await api.post(`/orders/restaurant/${selectedOrder.id}/accept/`, { preparation_time: prepTime });
      addToast({ 
        title: 'Order Accepted', 
        message: `Order #${selectedOrder.id} accepted. Prep time: ${prepTime} mins`, 
        variant: 'success' 
      });
      setAcceptModalOpen(false);
      setPrepTime('');
      setSelectedOrder(null);
      // Refresh orders
      const ordersResponse = await api.get('/orders/restaurant/orders/');
      const orders = ordersResponse.data.results || [];
      setData(prev => ({ ...prev, recent_orders: orders.slice(0, 10) }));
    } catch (err) {
      console.error('Accept error:', err);
      addToast({ title: 'Error', message: 'Failed to accept order.', variant: 'error' });
    }
  };

  if (error) return <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{error}</div>;
  if (!data) return <div className="rounded-2xl bg-white p-6 text-sm text-slate-500 shadow-sm">Loading dashboard metrics...</div>;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-slate-900">Recent Orders</h3>
              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
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
                      <td className="px-2 py-3 text-sm font-medium text-slate-700">LKR {Number(order.total_price || order.total_amount || 0).toLocaleString()}</td>
                      <td className="px-2 py-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-2 py-3">
                        {order.status === 'pending' ? (
                          <div className="flex gap-1">
                            <button 
                              type="button" 
                              onClick={() => handleAcceptOrder(order)}
                              className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                            >
                              Accept
                            </button>
                            <button 
                              type="button" 
                              onClick={() => handleRejectOrder(order)}
                              className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <button type="button" className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200">
                            View
                          </button>
                        )}
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
          <section className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Today's Revenue</h3>
                <p className="mt-1 text-4xl font-semibold text-slate-900">LKR 54,320</p>
              </div>
              <button type="button" className="rounded-xl p-1.5 text-slate-500 hover:bg-slate-100">
                <MoreHorizontal size={18} />
              </button>
            </div>

            <div className="mt-4 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueSeries} margin={{ top: 8, right: 0, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>

                  <XAxis
                    dataKey="time"
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    ticks={['8AM', '12PM', '4PM', '8PM']}
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                  />
                  <YAxis
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    ticks={[10000, 20000, 30000]}
                    tickFormatter={(value) => `${value / 1000}k`}
                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                  />

                  <Tooltip
                    formatter={(value) => [`LKR ${Number(value).toLocaleString()}`, 'Revenue']}
                    labelFormatter={(label) => `Time ${label}`}
                  />

                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#2563eb"
                    strokeWidth={3}
                    fill="url(#revenueFill)"
                    dot={{ r: 3, fill: '#ffffff', stroke: '#2563eb', strokeWidth: 2 }}
                    activeDot={{ r: 5, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
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

          <section className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
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

      <MenuItemsSection
        items={items}
        loading={itemsLoading}
        error={itemsError}
        onAdd={openAddModal}
        onEdit={openEditModal}
        onDelete={handleDelete}
        onToggle={handleToggle}
      />

      <MenuItemModal
        open={modalOpen}
        item={editingItem}
        onClose={() => {
          setModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
      />

      {/* Accept Order Modal - Only for Delivery */}
      {acceptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setAcceptModalOpen(false)}>
          <div className="rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400, width: '90%' }}>
            <h3 className="text-xl font-semibold text-slate-900">Accept Delivery Order #{selectedOrder?.id}</h3>
            <p className="mt-2 text-sm text-slate-600">How many minutes for food preparation?</p>
            <input
              type="number"
              min="1"
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
              placeholder="e.g., 15"
              className="mt-3 w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <p className="mt-2 text-xs text-slate-500">
              Estimated delivery: Prep time + 30 mins delivery
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={confirmAcceptOrder}
                className="flex-1 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Confirm Accept
              </button>
              <button
                onClick={() => {
                  setAcceptModalOpen(false);
                  setPrepTime('');
                  setSelectedOrder(null);
                }}
                className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}