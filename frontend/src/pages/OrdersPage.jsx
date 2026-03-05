import { useEffect, useState } from 'react';
import StatusBadge from '../components/StatusBadge';
import { restaurantApi } from '../services/restaurantApi';

const ORDER_STATUSES = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

const nextStatusActions = {
  PENDING: { label: 'Accept', status: 'ACCEPTED' },
  ACCEPTED: { label: 'Preparing', status: 'PREPARING' },
  PREPARING: { label: 'Mark Ready', status: 'READY' },
  READY: { label: 'Out for Delivery', status: 'OUT_FOR_DELIVERY' },
  OUT_FOR_DELIVERY: { label: 'Delivered', status: 'DELIVERED' },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');

  const loadOrders = async (status = '') => {
    try {
      const response = await restaurantApi.getOrders(status);
      setOrders(response.data);
      setError('');
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Restaurant orders endpoint not found. Please ensure you are logged in as a restaurant owner.');
      } else {
        setError('Unable to load orders.');
      }
    }
  };

  useEffect(() => {
    loadOrders(statusFilter);
  }, [statusFilter]);

  const updateStatus = async (orderId, status) => {
    try {
      await restaurantApi.updateOrderStatus(orderId, status);
      loadOrders(statusFilter);
    } catch {
      setError('Order status update failed.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-2xl font-semibold text-slate-900">Orders</h3>
          <p className="text-sm text-slate-500">Monitor and move orders through every stage.</p>
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none ring-blue-200 focus:ring-2"
        >
          <option value="">All Statuses</option>
          {ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status.replaceAll('_', ' ')}
            </option>
          ))}
        </select>
      </div>

      {error ? <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}

      <section className="overflow-hidden rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-2 py-3">Order ID</th>
                <th className="px-2 py-3">Customer</th>
                <th className="px-2 py-3">Items</th>
                <th className="px-2 py-3">Total</th>
                <th className="px-2 py-3">Status</th>
                <th className="px-2 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length ? (
                orders.map((order) => {
                  const action = nextStatusActions[order.status];
                  return (
                    <tr key={order.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-2 py-3 text-sm font-semibold text-slate-700">#{order.id}</td>
                      <td className="px-2 py-3 text-sm text-slate-700">{order.student_name || order.student}</td>
                      <td className="px-2 py-3 text-sm text-slate-600">{order.items?.length || 0}</td>
                      <td className="px-2 py-3 text-sm font-medium text-slate-700">
                        LKR {Number(order.total_amount).toLocaleString()}
                      </td>
                      <td className="px-2 py-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-2 py-3">
                        {action ? (
                          <button
                            type="button"
                            className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                            onClick={() => updateStatus(order.id, action.status)}
                          >
                            {action.label}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500">No actions</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-2 py-6 text-center text-sm text-slate-500">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}