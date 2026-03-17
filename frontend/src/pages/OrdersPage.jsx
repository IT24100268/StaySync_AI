import { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  Eye,
  Grid2X2,
  Star,
} from 'lucide-react';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import StatusBadge from '../components/StatusBadge';
import { restaurantApi } from '../services/restaurantApi';

const ORDER_STATUSES = [
  'PENDING',
  'ACCEPTED',
  'PREPARING',
  'READY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
];

const nextStatusActions = {
  PENDING: { label: 'Accept', status: 'ACCEPTED' },
  ACCEPTED: { label: 'Preparing', status: 'PREPARING' },
  PREPARING: { label: 'Mark Ready', status: 'READY' },
  READY: { label: 'Out for Delivery', status: 'OUT_FOR_DELIVERY' },
  OUT_FOR_DELIVERY: { label: 'Delivered', status: 'DELIVERED' },
};

const mockFoodImages = [
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=800&q=80',
];

function normalizeOrders(responseData) {
  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData?.results)) return responseData.results;
  return [];
}

function formatStatusLabel(status = '') {
  return status.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function getCustomerName(order) {
  return order.student_name || order.customer_name || order.student || 'Customer';
}

function getOrderTotal(order) {
  return Number(order.total_amount || order.total_price || 0);
}

function getOrderItemsCount(order) {
  return order.items?.length || order.item_count || 0;
}

function getOrderSummary(order) {
  if (order.items?.length) {
    return order.items
      .map((item) => item.name || item.food_item_name || item.food_name || 'Item')
      .slice(0, 2)
      .join(' & ');
  }

  return `${getOrderItemsCount(order)} items`;
}

function KpiMiniCard({ label, value, detail, detailClass = '' }) {
  return (
    <div className="restaurant-orders-kpi">
      <p className="restaurant-orders-kpi__label">{label}</p>
      <h3 className="restaurant-orders-kpi__value">{value}</h3>
      <p className={`restaurant-orders-kpi__detail ${detailClass}`}>{detail}</p>
    </div>
  );
}

function OrderRow({ order, index, onAction }) {
  const action = nextStatusActions[order.status];
  const summary = getOrderSummary(order);
  const image = order.items?.[0]?.image_url || order.items?.[0]?.image || mockFoodImages[index % mockFoodImages.length];

  return (
    <tr>
      <td className="restaurant-orders-table__id">#{order.id}</td>
      <td>{getCustomerName(order)}</td>
      <td>
        <div className="restaurant-orders-table__summary">
          <img src={image} alt={summary} />
          <div>
            <strong>{summary}</strong>
            <span>{getOrderItemsCount(order)} items</span>
          </div>
        </div>
      </td>
      <td className="restaurant-orders-table__total">
        LKR {getOrderTotal(order).toLocaleString()}
      </td>
      <td>
        <StatusBadge status={order.status} />
      </td>
      <td>
        {action ? (
          <button
            type="button"
            className="restaurant-orders-action-btn"
            onClick={() => onAction(order.id, action.status)}
          >
            {action.label}
          </button>
        ) : (
          <button type="button" className="restaurant-orders-view-btn">
            <Eye size={14} />
            <span>View</span>
          </button>
        )}
      </td>
    </tr>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchText, setSearchText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadOrders = async (status = '') => {
    try {
      setLoading(true);
      const response = await restaurantApi.getOrders(status);
      setOrders(normalizeOrders(response.data));
      setError('');
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Restaurant orders endpoint not found. Please ensure you are logged in as a restaurant owner.');
      } else {
        setError('Unable to load orders.');
      }
    } finally {
      setLoading(false);
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

  const filteredOrders = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    return orders.filter((order) => {
      const customer = String(getCustomerName(order)).toLowerCase();
      const orderId = String(order.id).toLowerCase();
      const summary = String(getOrderSummary(order)).toLowerCase();

      return !search || customer.includes(search) || orderId.includes(search) || summary.includes(search);
    });
  }, [orders, searchText]);

  const statusTabs = useMemo(() => {
    const counts = {
      ALL: orders.length,
      PENDING: orders.filter((order) => order.status === 'PENDING').length,
      PREPARING: orders.filter((order) => ['ACCEPTED', 'PREPARING', 'READY'].includes(order.status)).length,
      OUT_FOR_DELIVERY: orders.filter((order) => order.status === 'OUT_FOR_DELIVERY').length,
      COMPLETED: orders.filter((order) => order.status === 'DELIVERED').length,
    };

    return [
      { label: 'All', value: '', count: counts.ALL },
      { label: 'Pending', value: 'PENDING', count: counts.PENDING },
      { label: 'Preparing', value: 'PREPARING', count: counts.PREPARING },
      { label: 'Out for Delivery', value: 'OUT_FOR_DELIVERY', count: counts.OUT_FOR_DELIVERY },
      { label: 'Completed', value: 'DELIVERED', count: counts.COMPLETED },
    ];
  }, [orders]);

  const stats = useMemo(() => {
    const todayOrders = filteredOrders.length;
    const revenue = filteredOrders
      .filter((order) => ['DELIVERED'].includes(order.status))
      .reduce((sum, order) => sum + getOrderTotal(order), 0);

    const activeOrders = filteredOrders.filter((order) =>
      ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'].includes(order.status)
    ).length;

    return {
      todayOrders,
      revenue,
      activeOrders,
    };
  }, [filteredOrders]);

  const pieData = useMemo(() => {
    const total = filteredOrders.length || 1;

    const rows = [
      {
        name: 'Pending',
        value: filteredOrders.filter((order) => order.status === 'PENDING').length,
        color: '#f4b43a',
      },
      {
        name: 'Preparing',
        value: filteredOrders.filter((order) => ['ACCEPTED', 'PREPARING', 'READY'].includes(order.status)).length,
        color: '#f28c28',
      },
      {
        name: 'Out for delivery',
        value: filteredOrders.filter((order) => order.status === 'OUT_FOR_DELIVERY').length,
        color: '#4f7cf7',
      },
      {
        name: 'Completed',
        value: filteredOrders.filter((order) => order.status === 'DELIVERED').length,
        color: '#49b454',
      },
    ];

    return rows.map((row) => ({
      ...row,
      percent: Math.round((row.value / total) * 100),
    }));
  }, [filteredOrders]);

  const pendingPercent = pieData.find((item) => item.name === 'Pending')?.percent || 0;
  const sideOrders = filteredOrders.slice(0, 3);

  return (
    <div className="restaurant-orders-page">
      <section className="restaurant-orders-topbar">
        <div className="restaurant-orders-topbar__title">
          <h3>Orders</h3>
        </div>

        <div className="restaurant-orders-search">
          <input
            type="text"
            placeholder="Search by ID, customer..."
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
        </div>
      </section>

      <div className="restaurant-orders-tabsbar">
        <div className="restaurant-orders-tabsbar__scroll">
          {statusTabs.map((tab) => {
            const active =
              (tab.value === '' && statusFilter === '') || statusFilter === tab.value;

            return (
              <button
                key={tab.label}
                type="button"
                className={`restaurant-orders-tab ${active ? 'active' : ''}`}
                onClick={() => setStatusFilter(tab.value)}
              >
                {tab.label} ({tab.count})
              </button>
            );
          })}
        </div>

        <button type="button" className="restaurant-category-filter-btn">
          <Grid2X2 size={16} />
          <span>All Categories</span>
          <ChevronDown size={15} />
        </button>
      </div>

      {error ? (
        <div className="restaurant-menu-message restaurant-menu-message--error">
          {error}
        </div>
      ) : null}

      <section className="section-card restaurant-orders-summary-card">
        <div className="section-header">
          <h3 className="section-title">Incoming Orders</h3>
        </div>

        <div className="restaurant-orders-summary-grid">
          <KpiMiniCard
            label="Today's Orders"
            value={stats.todayOrders}
            detail="+ 22.5% from yesterday"
            detailClass="warm"
          />
          <KpiMiniCard
            label="Revenue View"
            value={`LKR ${stats.revenue.toLocaleString()}`}
            detail="+ 12.5% weekly growth"
          />
          <KpiMiniCard
            label="Active Orders"
            value={stats.activeOrders}
            detail={`+ ${stats.activeOrders} live now`}
            detailClass="cool"
          />
        </div>
      </section>

      <div className="restaurant-orders-main-grid">
        <section className="section-card restaurant-orders-table-card">
          <div className="section-header">
            <h3 className="section-title">Incoming Orders</h3>
            <button type="button" className="soft-action-btn">
              View All
            </button>
          </div>

          <div className="restaurant-orders-table-wrap">
            <table className="restaurant-orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Item Summary</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="restaurant-orders-empty">
                      Loading orders...
                    </td>
                  </tr>
                ) : filteredOrders.length ? (
                  filteredOrders.map((order, index) => (
                    <OrderRow
                      key={order.id}
                      order={order}
                      index={index}
                      onAction={updateStatus}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="restaurant-orders-empty">
                      No orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="restaurant-menu-footer">
            <p>
              Showing <strong>{filteredOrders.length}</strong> out of{' '}
              <strong>{orders.length}</strong> items
            </p>

            <div className="restaurant-pagination">
              <button type="button" className="active">1</button>
              <button type="button">2</button>
              <button type="button" className="restaurant-pagination__next">
                View
              </button>
            </div>
          </div>
        </section>

        <aside className="restaurant-orders-sidebar">
          <section className="section-card status-chart-card">
            <h3 className="section-title">Order Status</h3>

            <div className="status-chart-card__chart">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    innerRadius={58}
                    outerRadius={84}
                    paddingAngle={3}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>

              <div className="status-chart-card__center">
                <strong>{pendingPercent}%</strong>
                <span>Pending</span>
              </div>
            </div>

            <div className="status-list">
              {pieData.map((entry) => (
                <div key={entry.name} className="status-list__item">
                  <div className="status-list__label">
                    <span
                      className="status-list__dot"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span>{entry.name}</span>
                  </div>
                  <span>{entry.percent}%</span>
                </div>
              ))}
            </div>
          </section>

          <section className="section-card restaurant-orders-side-list">
            <h3 className="section-title">Incoming Orders</h3>

            <div className="restaurant-orders-side-list__items">
              {sideOrders.length ? (
                sideOrders.map((order, index) => (
                  <article key={order.id} className="restaurant-orders-side-item">
                    <img
                      src={order.items?.[0]?.image_url || mockFoodImages[index % mockFoodImages.length]}
                      alt={getOrderSummary(order)}
                    />
                    <div>
                      <h4>{getCustomerName(order)}</h4>
                      <p>{getOrderSummary(order)}</p>
                      <span>LKR {getOrderTotal(order).toLocaleString()}</span>
                    </div>
                  </article>
                ))
              ) : (
                <p className="restaurant-orders-side-list__empty">No active incoming orders.</p>
              )}
            </div>
          </section>
        </aside>
      </div>

      <div className="dashboard-bottom-split">
        <section className="promo-status-card">
          <div className="promo-status-card__top">
            <div>
              <h4>Restaurant Status</h4>
              <p>Open</p>
            </div>

            <label className="switch">
              <input type="checkbox" defaultChecked />
              <span className="slider" />
            </label>
          </div>

          <div className="promo-status-card__body">
            <h5>Upgrade Plan</h5>
            <p>Unlock advanced insights and analytics.</p>
            <button type="button">Go Pro</button>
          </div>
        </section>

        <section className="section-card restaurant-orders-mini-table">
          <div className="section-header">
            <h3 className="section-title">Incoming Orders</h3>
          </div>

          <div className="restaurant-orders-mini-list">
            {filteredOrders.slice(0, 4).map((order) => (
              <div key={order.id} className="restaurant-orders-mini-row">
                <div>
                  <strong>#{order.id}</strong>
                  <p>{getOrderSummary(order)}</p>
                </div>
                <span>LKR {getOrderTotal(order).toLocaleString()}</span>
                <StatusBadge status={order.status} />
              </div>
            ))}

            {!filteredOrders.length ? (
              <div className="restaurant-orders-empty">No recent orders.</div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}