import { useMemo, useState } from 'react';
import { DollarSign, TrendingUp, Calendar, MoreHorizontal } from 'lucide-react';
import { Area, AreaChart, Bar, ComposedChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const mockChartData = [
  { day: 'Mon', orders: 12500, reservations: 3200 },
  { day: 'Tue', orders: 15800, reservations: 4100 },
  { day: 'Wed', orders: 18200, reservations: 5300 },
  { day: 'Thu', orders: 14600, reservations: 3800 },
  { day: 'Fri', orders: 22400, reservations: 6900 },
  { day: 'Sat', orders: 28900, reservations: 8200 },
  { day: 'Sun', orders: 24300, reservations: 7100 },
];

const mockTopItems = [
  { id: 1, name: 'Margherita Pizza', orders: 142, amount: 170400, image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200' },
  { id: 2, name: 'Chicken Burger', orders: 98, amount: 34300, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200' },
  { id: 3, name: 'Caesar Salad', orders: 76, amount: 68400, image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=200' },
];

const mockTransactions = [
  { date: 'April 24, 2024', orderId: '#109', customer: 'Mathu', amount: 2300, payment: 'Visa', status: 'Paid' },
  { date: 'April 24, 2024', orderId: '#108', customer: 'Sahan', amount: 1850, payment: 'Cash', status: 'Paid' },
  { date: 'April 23, 2024', orderId: '#107', customer: 'Nimal', amount: 3200, payment: 'Credit Card', status: 'Paid' },
  { date: 'April 23, 2024', orderId: '#106', customer: 'Kamal', amount: 1450, payment: 'Visa', status: 'Paid' },
  { date: 'April 22, 2024', orderId: '#105', customer: 'Dilshan', amount: 2900, payment: 'Cash', status: 'Paid' },
];

export default function EarningsPage() {
  const [chartFilter, setChartFilter] = useState('week');
  const [tableFilter, setTableFilter] = useState('today');

  const kpiData = useMemo(() => ({
    today: { amount: 18750, growth: '+15.4% from yesterday' },
    week: { amount: 124800, growth: '+18.2% this week' },
    month: { amount: 487500, growth: '+14.5% this month' },
    total: { amount: 2847600, growth: 'All time' },
  }), []);

  const chartTotal = useMemo(() => {
    return mockChartData.reduce((sum, item) => sum + item.orders + item.reservations, 0);
  }, []);

  return (
    <div className="earnings-page">
      <div className="earnings-header">
        <div>
          <h2 className="earnings-title">Earnings</h2>
          <p className="earnings-subtitle">Manage your restaurant's earnings and account details.</p>
        </div>
      </div>

      <div className="earnings-kpi-grid">
        <div className="earnings-kpi-card">
          <DollarSign size={20} className="earnings-kpi-icon" />
          <div className="earnings-kpi-value">LKR {kpiData.today.amount.toLocaleString()}</div>
          <div className="earnings-kpi-label">Today's Earnings</div>
          <div className="earnings-kpi-growth">{kpiData.today.growth}</div>
        </div>

        <div className="earnings-kpi-card">
          <TrendingUp size={20} className="earnings-kpi-icon" />
          <div className="earnings-kpi-value">LKR {kpiData.week.amount.toLocaleString()}</div>
          <div className="earnings-kpi-label">Weekly Earnings</div>
          <div className="earnings-kpi-growth">{kpiData.week.growth}</div>
        </div>

        <div className="earnings-kpi-card">
          <Calendar size={20} className="earnings-kpi-icon" />
          <div className="earnings-kpi-value">LKR {kpiData.month.amount.toLocaleString()}</div>
          <div className="earnings-kpi-label">Monthly Earnings</div>
          <div className="earnings-kpi-growth">{kpiData.month.growth}</div>
        </div>

        <div className="earnings-kpi-card">
          <DollarSign size={20} className="earnings-kpi-icon" />
          <div className="earnings-kpi-value">LKR {kpiData.total.amount.toLocaleString()}</div>
          <div className="earnings-kpi-label">Total Earnings</div>
          <div className="earnings-kpi-growth">{kpiData.total.growth}</div>
        </div>
      </div>

      <div className="earnings-main-grid">
        <div className="section-card earnings-chart-card">
          <div className="earnings-chart-header">
            <div>
              <h3 className="section-title">Earnings Overview</h3>
              <div className="earnings-chart-total">LKR {chartTotal.toLocaleString()}</div>
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
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={mockChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="earningsAreaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f39028" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f39028" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#8b6f63', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8b6f63', fontSize: 12 }} />
                <Tooltip formatter={(value) => [`LKR ${Number(value).toLocaleString()}`, '']} />
                <Legend wrapperStyle={{ paddingTop: 20 }} />
                <Bar dataKey="reservations" fill="#fcd9b8" radius={[8, 8, 0, 0]} />
                <Area type="monotone" dataKey="orders" stroke="#f39028" strokeWidth={3} fill="url(#earningsAreaFill)" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="section-card earnings-top-items-card">
          <h3 className="section-title">Top Selling Items</h3>
          <div className="earnings-top-items-list">
            {mockTopItems.map((item) => (
              <div key={item.id} className="earnings-top-item">
                <img src={item.image} alt={item.name} />
                <div className="earnings-top-item-info">
                  <h4>{item.name}</h4>
                  <p>{item.orders} orders</p>
                  <span>LKR {item.amount.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
          <button type="button" className="earnings-view-all-btn">View All</button>
        </div>
      </div>

      <div className="earnings-lower-grid">
        <div className="earnings-lower-left">
          <div className="promo-status-card">
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
              <button
                type="button"
                className={`earnings-filter-pill ${tableFilter === 'custom' ? 'active' : ''}`}
                onClick={() => setTableFilter('custom')}
              >
                Custom
              </button>
            </div>
          </div>

          <div className="earnings-table-wrap">
            <table className="earnings-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {mockTransactions.map((tx, idx) => (
                  <tr key={idx}>
                    <td>{tx.date}</td>
                    <td className="earnings-table-order-id">{tx.orderId}</td>
                    <td>{tx.customer}</td>
                    <td className="earnings-table-amount">LKR {tx.amount.toLocaleString()}</td>
                    <td>{tx.payment}</td>
                    <td>
                      <span className="earnings-status-badge">{tx.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="earnings-table-footer">
            <p>Showing 5 out of 120 transactions</p>
            <div className="earnings-pagination">
              <button type="button" className="earnings-page-btn active">1</button>
              <button type="button" className="earnings-page-btn">2</button>
              <button type="button" className="earnings-page-btn">3</button>
              <button type="button" className="earnings-page-btn">Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
