import { useEffect, useMemo, useState } from 'react';
import { Calendar, DollarSign, RefreshCcw, TrendingUp } from 'lucide-react';
import { Area, Bar, ComposedChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { restaurantApi } from '../../services/restaurantApi';

const DAY_MS = 24 * 60 * 60 * 1000;

function normalizeOrders(responseData) {
  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData?.results)) return responseData.results;
  return [];
}

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function formatCurrency(value) {
  return `LKR ${toNumber(value).toLocaleString('en-LK')}`;
}

function statusKey(status = '') {
  return String(status || '').trim().toLowerCase();
}

function formatStatus(status = '') {
  const key = statusKey(status);
  if (!key) return 'Unknown';
  return key.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDateTime(value) {
  const date = new Date(value || '');
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('en-LK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getInitials(value = '') {
  const clean = String(value || '').trim();
  if (!clean) return 'ST';
  const parts = clean.split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]).join('').toUpperCase();
}

function getOrderDate(order) {
  const value = order?.updated_at || order?.created_at || '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getOrderTotal(order) {
  return toNumber(order?.total_price ?? order?.total_amount, 0);
}

function getStudentName(order) {
  return String(order?.student_name || order?.customer_name || order?.student || 'Student').trim() || 'Student';
}

function getStudentAvatar(order) {
  return (
    String(order?.student_display_image || '').trim() ||
    String(order?.student_profile_image || '').trim() ||
    String(order?.student_image || '').trim() ||
    ''
  );
}

function toAbsoluteMediaUrl(url) {
  const clean = String(url || '').trim();
  if (!clean) return '';
  if (/^https?:\/\//i.test(clean)) return clean;

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const host = apiBase.replace(/\/api\/?$/, '');
  if (clean.startsWith('/')) return `${host}${clean}`;
  return `${host}/${clean}`;
}

function sameDay(left, right) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function isInFilterRange(date, filter) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return false;

  const now = new Date();
  if (filter === 'today') return sameDay(date, now);

  if (filter === 'week') {
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return date >= start && date <= now;
  }

  if (filter === 'month') {
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }

  if (filter === 'year') {
    return date.getFullYear() === now.getFullYear();
  }

  return true;
}

const CONFIRMED_STATUSES = new Set(['accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered']);

function isConfirmedOrder(order) {
  return CONFIRMED_STATUSES.has(statusKey(order?.status));
}

function getOrderTypeRevenueKey(order) {
  return String(order?.order_type || '').toLowerCase() === 'takeaway' ? 'takeaway' : 'delivery';
}

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildRevenueChartData(orders, filter) {
  const now = new Date();

  if (filter === 'today') {
    const data = [
      { slot: '00-04', delivery: 0, takeaway: 0 },
      { slot: '04-08', delivery: 0, takeaway: 0 },
      { slot: '08-12', delivery: 0, takeaway: 0 },
      { slot: '12-16', delivery: 0, takeaway: 0 },
      { slot: '16-20', delivery: 0, takeaway: 0 },
      { slot: '20-24', delivery: 0, takeaway: 0 },
    ];

    orders.forEach((order) => {
      const date = getOrderDate(order);
      if (!date || !isInFilterRange(date, 'today')) return;

      const bucketIndex = Math.min(Math.floor(date.getHours() / 4), data.length - 1);
      const revenueKey = getOrderTypeRevenueKey(order);
      data[bucketIndex][revenueKey] += getOrderTotal(order);
    });

    return data;
  }

  if (filter === 'month') {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const weekCount = Math.ceil(daysInMonth / 7);
    const data = Array.from({ length: weekCount }, (_, index) => ({
      slot: `Week ${index + 1}`,
      delivery: 0,
      takeaway: 0,
    }));

    orders.forEach((order) => {
      const date = getOrderDate(order);
      if (!date || !isInFilterRange(date, 'month')) return;

      const weekIndex = Math.min(Math.floor((date.getDate() - 1) / 7), weekCount - 1);
      const revenueKey = getOrderTypeRevenueKey(order);
      data[weekIndex][revenueKey] += getOrderTotal(order);
    });

    return data;
  }

  const start = new Date(now);
  start.setDate(now.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  const weekData = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start.getTime() + index * DAY_MS);
    return {
      slot: date.toLocaleDateString('en-LK', { weekday: 'short' }),
      dateKey: getDateKey(date),
      delivery: 0,
      takeaway: 0,
    };
  });

  const indexByDate = new Map(weekData.map((item, index) => [item.dateKey, index]));

  orders.forEach((order) => {
    const date = getOrderDate(order);
    if (!date || !isInFilterRange(date, 'week')) return;

    const dateIndex = indexByDate.get(getDateKey(date));
    if (dateIndex === undefined) return;

    const revenueKey = getOrderTypeRevenueKey(order);
    weekData[dateIndex][revenueKey] += getOrderTotal(order);
  });

  return weekData.map(({ dateKey, ...rest }) => rest);
}

function buildTopItems(orders) {
  const itemMap = new Map();

  orders.forEach((order) => {
    const items = Array.isArray(order?.items) ? order.items : [];
    items.forEach((item) => {
      const menuItem = item?.menu_item || {};
      const name = String(menuItem.name || item?.name || 'Menu item').trim() || 'Menu item';
      const mapKey = String(menuItem.id || name).trim();
      const quantity = Math.max(toNumber(item?.quantity, 1), 1);
      const unitPrice = toNumber(item?.price ?? menuItem?.price, 0);
      const amount = unitPrice * quantity;
      const image = toAbsoluteMediaUrl(menuItem?.image_url || menuItem?.image || '');

      if (!itemMap.has(mapKey)) {
        itemMap.set(mapKey, {
          id: mapKey,
          name,
          orders: 0,
          amount: 0,
          image,
        });
      }

      const current = itemMap.get(mapKey);
      current.orders += quantity;
      current.amount += amount;
      if (!current.image && image) current.image = image;
    });
  });

  return [...itemMap.values()]
    .sort((first, second) => second.amount - first.amount)
    .slice(0, 5);
}

function buildTopStudents(orders) {
  const studentMap = new Map();

  orders.forEach((order) => {
    const studentName = getStudentName(order);
    const studentAvatar = toAbsoluteMediaUrl(getStudentAvatar(order));
    const studentId = String(order?.student || order?.student_id || studentName).trim();
    const amount = getOrderTotal(order);
    const orderDate = getOrderDate(order)?.getTime() || 0;

    if (!studentMap.has(studentId)) {
      studentMap.set(studentId, {
        id: studentId,
        name: studentName,
        avatar: studentAvatar,
        orders: 0,
        amount: 0,
        lastOrderAt: 0,
      });
    }

    const current = studentMap.get(studentId);
    current.orders += 1;
    current.amount += amount;
    current.lastOrderAt = Math.max(current.lastOrderAt, orderDate);
    if (!current.avatar && studentAvatar) current.avatar = studentAvatar;
  });

  return [...studentMap.values()]
    .sort((first, second) => second.amount - first.amount || second.lastOrderAt - first.lastOrderAt)
    .slice(0, 6);
}

function getKpiMetric(orders, filter) {
  const filtered = orders.filter((order) => {
    const date = getOrderDate(order);
    return date && isInFilterRange(date, filter);
  });

  return {
    amount: filtered.reduce((sum, order) => sum + getOrderTotal(order), 0),
    count: filtered.length,
  };
}

function getStatusClass(status) {
  const key = statusKey(status);
  if (key === 'delivered') return 'is-delivered';
  if (key === 'rejected') return 'is-canceled';
  if (['ready', 'accepted', 'preparing'].includes(key)) return 'is-preparing';
  if (key === 'out_for_delivery') return 'is-onway';
  return 'is-pending';
}

export default function EarningsPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [chartFilter, setChartFilter] = useState('week');
  const [tableFilter, setTableFilter] = useState('today');

  const fetchOrders = async (initialLoad = false) => {
    if (initialLoad) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const response = await restaurantApi.getOrders();
      setOrders(normalizeOrders(response.data));
      setError('');
    } catch (fetchError) {
      console.error('Error loading earnings data:', fetchError);
      setOrders([]);
      setError('Unable to load earnings right now. Please refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchOrders(true);
    const interval = setInterval(() => fetchOrders(false), 15000);
    return () => clearInterval(interval);
  }, []);

  const confirmedOrders = useMemo(
    () => orders.filter((order) => isConfirmedOrder(order)),
    [orders]
  );

  const todayKpi = useMemo(() => getKpiMetric(confirmedOrders, 'today'), [confirmedOrders]);
  const weekKpi = useMemo(() => getKpiMetric(confirmedOrders, 'week'), [confirmedOrders]);
  const monthKpi = useMemo(() => getKpiMetric(confirmedOrders, 'month'), [confirmedOrders]);

  const totalKpi = useMemo(
    () => ({
      amount: confirmedOrders.reduce((sum, order) => sum + getOrderTotal(order), 0),
      count: confirmedOrders.length,
    }),
    [confirmedOrders]
  );

  const chartData = useMemo(
    () => buildRevenueChartData(confirmedOrders, chartFilter),
    [confirmedOrders, chartFilter]
  );

  const chartTotal = useMemo(
    () => chartData.reduce((sum, item) => sum + toNumber(item.delivery) + toNumber(item.takeaway), 0),
    [chartData]
  );

  const filteredConfirmedForTopItems = useMemo(
    () =>
      confirmedOrders.filter((order) => {
        const date = getOrderDate(order);
        return date && isInFilterRange(date, chartFilter);
      }),
    [confirmedOrders, chartFilter]
  );

  const topItems = useMemo(
    () => buildTopItems(filteredConfirmedForTopItems),
    [filteredConfirmedForTopItems]
  );

  const filteredOrders = useMemo(
    () =>
      orders
        .filter((order) => {
          const date = getOrderDate(order);
          return date && isInFilterRange(date, tableFilter);
        })
        .sort((first, second) => {
          const firstDate = getOrderDate(first)?.getTime() || 0;
          const secondDate = getOrderDate(second)?.getTime() || 0;
          return secondDate - firstDate;
        }),
    [orders, tableFilter]
  );

  const transactions = useMemo(
    () => filteredOrders.filter((order) => statusKey(order.status) !== 'rejected'),
    [filteredOrders]
  );

  const topStudents = useMemo(
    () => buildTopStudents(transactions),
    [transactions]
  );

  return (
    <div className="earnings-page">
      <div className="earnings-header">
        <div>
          <h2 className="earnings-title">Earnings</h2>
          <p className="earnings-subtitle">Track real earnings, top students, and completed sales performance.</p>
        </div>
        <div className="earnings-header-actions">
          <button
            type="button"
            className="earnings-filter-btn"
            onClick={() => fetchOrders(false)}
            disabled={refreshing}
          >
            <RefreshCcw size={14} className={refreshing ? 'spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error ? <div className="earnings-feedback">{error}</div> : null}

      <div className="earnings-kpi-grid">
        <div className="earnings-kpi-card">
          <DollarSign size={20} className="earnings-kpi-icon" />
          <div className="earnings-kpi-value">{formatCurrency(todayKpi.amount)}</div>
          <div className="earnings-kpi-label">Today's Earnings</div>
          <div className="earnings-kpi-growth">{todayKpi.count} confirmed orders</div>
        </div>

        <div className="earnings-kpi-card">
          <TrendingUp size={20} className="earnings-kpi-icon" />
          <div className="earnings-kpi-value">{formatCurrency(weekKpi.amount)}</div>
          <div className="earnings-kpi-label">Weekly Earnings</div>
          <div className="earnings-kpi-growth">{weekKpi.count} confirmed orders</div>
        </div>

        <div className="earnings-kpi-card">
          <Calendar size={20} className="earnings-kpi-icon" />
          <div className="earnings-kpi-value">{formatCurrency(monthKpi.amount)}</div>
          <div className="earnings-kpi-label">Monthly Earnings</div>
          <div className="earnings-kpi-growth">{monthKpi.count} confirmed orders</div>
        </div>

        <div className="earnings-kpi-card">
          <DollarSign size={20} className="earnings-kpi-icon" />
          <div className="earnings-kpi-value">{formatCurrency(totalKpi.amount)}</div>
          <div className="earnings-kpi-label">Total Earnings</div>
          <div className="earnings-kpi-growth">{totalKpi.count} confirmed orders</div>
        </div>
      </div>

      <div className="earnings-main-grid">
        <div className="section-card earnings-chart-card">
          <div className="earnings-chart-header">
            <div>
              <h3 className="section-title">Earnings Overview</h3>
              <div className="earnings-chart-total">{formatCurrency(chartTotal)}</div>
            </div>
            <div className="earnings-chart-filters">
              <button
                type="button"
                className={`earnings-filter-btn ${chartFilter === 'today' ? 'active' : ''}`}
                onClick={() => setChartFilter('today')}
              >
                Today
              </button>
              <button
                type="button"
                className={`earnings-filter-btn ${chartFilter === 'week' ? 'active' : ''}`}
                onClick={() => setChartFilter('week')}
              >
                This Week
              </button>
              <button
                type="button"
                className={`earnings-filter-btn ${chartFilter === 'month' ? 'active' : ''}`}
                onClick={() => setChartFilter('month')}
              >
                This Month
              </button>
            </div>
          </div>

          <div className="earnings-chart-wrap">
            {loading ? (
              <div className="earnings-empty-note">Loading chart data...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="earningsAreaFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f39028" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f39028" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="slot" axisLine={false} tickLine={false} tick={{ fill: '#8b6f63', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8b6f63', fontSize: 12 }} />
                  <Tooltip formatter={(value) => [formatCurrency(value), '']} />
                  <Legend wrapperStyle={{ paddingTop: 20 }} />
                  <Bar dataKey="takeaway" name="Takeaway" fill="#fcd9b8" radius={[8, 8, 0, 0]} />
                  <Area type="monotone" dataKey="delivery" name="Delivery" stroke="#f39028" strokeWidth={3} fill="url(#earningsAreaFill)" />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="section-card earnings-top-items-card">
          <h3 className="section-title">Top Selling Items</h3>
          <div className="earnings-top-items-list">
            {topItems.length === 0 ? (
              <p className="earnings-empty-note">No delivered item data for this period yet.</p>
            ) : (
              topItems.map((item) => (
                <div key={item.id} className="earnings-top-item">
                  {item.image ? (
                    <img src={item.image} alt={item.name} />
                  ) : (
                    <div className="earnings-top-item-image-fallback">{item.name.slice(0, 1).toUpperCase()}</div>
                  )}
                  <div className="earnings-top-item-info">
                    <h4>{item.name}</h4>
                    <p>{item.orders} sold</p>
                    <span>{formatCurrency(item.amount)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="earnings-lower-grid">
        <div className="section-card earnings-students-card">
          <div className="earnings-transactions-header">
            <h3 className="section-title">Top Students</h3>
            <div className="earnings-top-students-meta">{topStudents.length} profiles</div>
          </div>

          <div className="earnings-students-list">
            {topStudents.length === 0 ? (
              <p className="earnings-empty-note">No student transaction data in this range.</p>
            ) : (
              topStudents.map((student) => (
                <div key={student.id} className="earnings-student-row">
                  <div className="earnings-student-main">
                    {student.avatar ? (
                      <img className="earnings-student-avatar" src={student.avatar} alt={student.name} />
                    ) : (
                      <span className="earnings-student-avatar earnings-student-avatar--fallback">
                        {getInitials(student.name)}
                      </span>
                    )}
                    <div className="earnings-student-meta">
                      <strong>{student.name}</strong>
                      <span>{student.orders} orders</span>
                    </div>
                  </div>
                  <div className="earnings-student-amount">{formatCurrency(student.amount)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="section-card earnings-transactions-card">
          <div className="earnings-transactions-header">
            <h3 className="section-title">Earnings Overview</h3>
            <div className="earnings-table-filters">
              <button
                type="button"
                className={`earnings-filter-pill ${tableFilter === 'today' ? 'active' : ''}`}
                onClick={() => setTableFilter('today')}
              >
                Today
              </button>
              <button
                type="button"
                className={`earnings-filter-pill ${tableFilter === 'week' ? 'active' : ''}`}
                onClick={() => setTableFilter('week')}
              >
                This Week
              </button>
              <button
                type="button"
                className={`earnings-filter-pill ${tableFilter === 'month' ? 'active' : ''}`}
                onClick={() => setTableFilter('month')}
              >
                This Month
              </button>
              <button
                type="button"
                className={`earnings-filter-pill ${tableFilter === 'year' ? 'active' : ''}`}
                onClick={() => setTableFilter('year')}
              >
                This Year
              </button>
            </div>
          </div>

          <div className="earnings-table-wrap">
            <table className="earnings-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Order ID</th>
                  <th>Student</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="earnings-table-empty">
                      No transactions in this period.
                    </td>
                  </tr>
                ) : (
                  transactions.map((order) => {
                    const studentName = getStudentName(order);
                    const studentAvatar = toAbsoluteMediaUrl(getStudentAvatar(order));
                    const itemsCount = Array.isArray(order.items) ? order.items.length : 0;
                    return (
                      <tr key={order.id}>
                        <td>{formatDateTime(order.updated_at || order.created_at)}</td>
                        <td className="earnings-table-order-id">#{order.id}</td>
                        <td>
                          <div className="earnings-customer-cell">
                            {studentAvatar ? (
                              <img className="earnings-customer-avatar" src={studentAvatar} alt={studentName} />
                            ) : (
                              <span className="earnings-customer-avatar earnings-customer-avatar--fallback">
                                {getInitials(studentName)}
                              </span>
                            )}
                            <div className="earnings-customer-meta">
                              <strong>{studentName}</strong>
                              <span>{order.student_email || order.student_phone || 'Student customer'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="earnings-table-item-count">{itemsCount} items</td>
                        <td className="earnings-table-amount">{formatCurrency(getOrderTotal(order))}</td>
                        <td>
                          <span className={`earnings-status-badge ${getStatusClass(order.status)}`}>
                            {formatStatus(order.status)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="earnings-table-footer">
            <p>Showing {transactions.length} transactions from real order data.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
