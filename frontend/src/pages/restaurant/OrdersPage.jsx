import { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  Eye,
  Grid2X2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import StatusBadge from '../../components/StatusBadge';
import { restaurantApi } from '../../services/restaurantApi';

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

function statusKey(status = '') {
  return String(status || '').toLowerCase();
}

function matchesStatusFilter(orderStatus = '', filter = '') {
  const current = statusKey(orderStatus);

  switch (filter) {
    case 'pending':
      return current === 'pending';
    case 'preparing':
      return ['accepted', 'preparing', 'ready'].includes(current);
    case 'out_for_delivery':
      return current === 'out_for_delivery';
    case 'delivered':
      return current === 'delivered';
    default:
      return true;
  }
}

function getCustomerName(order) {
  return order.student_name || order.customer_name || order.student || 'Customer';
}

function getCustomerAvatar(order) {
  return (
    order.student_display_image ||
    order.student?.profile?.display_image ||
    order.student?.student_profile?.display_image ||
    order.student_avatar ||
    order.customer_avatar ||
    order.student_image ||
    order.customer_image ||
    order.student_profile_image ||
    order.customer_profile_image ||
    order.student?.avatar ||
    order.customer?.avatar ||
    ''
  );
}

function getCustomerContact(order) {
  return (
    order.student_phone ||
    order.student_email ||
    order.customer_email ||
    order.customer_phone ||
    (order.student_id ? `Student ID #${order.student_id}` : '')
  );
}

function getDeliveryPartnerName(order) {
  return String(order.delivery_partner_name || '').trim();
}

function getDeliveryPartnerAvatar(order) {
  return String(order.delivery_partner_display_image || '').trim();
}

function getDeliveryPartnerPhone(order) {
  return String(order.delivery_partner_phone || '').trim();
}

function getDeliveryPartnerVehicle(order) {
  const type = String(order.delivery_partner_vehicle_type || '').trim();
  const number = String(order.delivery_partner_vehicle_number || '').trim();
  return [type, number].filter(Boolean).join(' • ');
}

function getInitials(value = '') {
  const clean = String(value).trim();
  if (!clean) return 'CU';
  const parts = clean.split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]).join('').toUpperCase();
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
      .map((item) => item.menu_item?.name || item.name || item.food_item_name || item.food_name || 'Item')
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
      {detail ? (
        <p className={`restaurant-orders-kpi__detail ${detailClass}`}>{detail}</p>
      ) : null}
    </div>
  );
}

function OrderRow({ order, onAccept, onReject, onView, onMarkTakeawayReady, markingTakeawayReadyId }) {
  const currentStatus = statusKey(order.status);
  const summary = getOrderSummary(order);
  const customerName = getCustomerName(order);
  const customerAvatar = getCustomerAvatar(order);
  const customerContact = getCustomerContact(order);
  const customerInitials = getInitials(customerName);
  const orderType = String(order.order_type || 'delivery').toUpperCase();
  const orderTypeKey = String(order.order_type || 'delivery').toLowerCase();
  const deliveryPartnerName = getDeliveryPartnerName(order);
  const canMarkTakeawayReady =
    orderTypeKey === 'takeaway' && ['accepted', 'preparing', 'ready'].includes(currentStatus);

  return (
    <tr>
      <td className="restaurant-orders-table__id">#{order.id}</td>
      <td>
        <div className="restaurant-orders-customer">
          {customerAvatar ? (
            <img
              className="restaurant-orders-customer__avatar"
              src={customerAvatar}
              alt={customerName}
            />
          ) : (
            <span className="restaurant-orders-customer__avatar restaurant-orders-customer__avatar--fallback">
              {customerInitials}
            </span>
          )}
          <div className="restaurant-orders-customer__meta">
            <strong>{customerName}</strong>
            <span>{customerContact || 'Student customer'}</span>
          </div>
        </div>
      </td>
      <td>
        <div className="restaurant-orders-table__summary">
          <strong>{summary}</strong>
          <span>{getOrderItemsCount(order)} items | {orderType}</span>
          <span>Student: {customerName}</span>
          {deliveryPartnerName ? <span>Rider: {deliveryPartnerName}</span> : null}
          <div className="restaurant-orders-table__summary-tags">
            {order.route_distance_km ? (
              <small>{Number(order.route_distance_km).toFixed(2)} km</small>
            ) : null}
            {order.estimated_delivery_time ? <small>ETA {order.estimated_delivery_time} min</small> : null}
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
        {currentStatus === 'pending' ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="restaurant-orders-action-btn" onClick={() => onAccept(order)}>
              <CheckCircle2 size={14} />
              <span>Accept</span>
            </button>
            <button type="button" className="restaurant-orders-reject-btn" onClick={() => onReject(order)}>
              <XCircle size={14} />
              <span>Reject</span>
            </button>
            <button type="button" className="restaurant-orders-view-btn" onClick={() => onView(order)}>
              <Eye size={14} />
              <span>View</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            {canMarkTakeawayReady ? (
              <button
                type="button"
                className="restaurant-orders-action-btn"
                onClick={() => onMarkTakeawayReady(order)}
                disabled={markingTakeawayReadyId === order.id}
              >
                <CheckCircle2 size={14} />
                <span>{markingTakeawayReadyId === order.id ? 'Updating...' : 'Preparation Ready'}</span>
              </button>
            ) : null}
            <button type="button" className="restaurant-orders-view-btn" onClick={() => onView(order)}>
              <Eye size={14} />
              <span>View</span>
            </button>
          </div>
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
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [markingCollectedId, setMarkingCollectedId] = useState(null);
  const [markingTakeawayReadyId, setMarkingTakeawayReadyId] = useState(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await restaurantApi.getOrders();
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
    loadOrders();
  }, []);

  const acceptOrder = async (order) => {
    const currentPrep = Number(order.preparation_time || 25);
    const input = window.prompt('Enter preparation time in minutes:', String(currentPrep));
    if (input === null) return;
    const preparationTime = Number(input);
    if (!Number.isFinite(preparationTime) || preparationTime < 0) {
      setError('Please enter a valid preparation time.');
      return;
    }

    try {
      await restaurantApi.acceptOrder(order.id, preparationTime);
      loadOrders();
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to accept order.');
    }
  };

  const rejectOrder = async (order) => {
    const reason = window.prompt('Enter rejection reason:', 'Restaurant is busy');
    if (reason === null) return;
    try {
      await restaurantApi.rejectOrder(order.id, reason || 'Restaurant is busy');
      loadOrders();
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject order.');
    }
  };

  const markOrderCollected = async (order) => {
    const currentStatus = statusKey(order?.status);
    const orderType = String(order?.order_type || 'delivery').toLowerCase();
    if (currentStatus !== 'out_for_delivery') {
      setError('This action is only available for orders that are out for delivery.');
      return;
    }

    setMarkingCollectedId(order.id);
    try {
      await restaurantApi.markCollectedByPartner(order.id);
      await loadOrders();
      setStatusFilter('delivered');
      closeOrderDetails();
      setError('');
    } catch (err) {
      setError(
        err.response?.data?.error ||
          (orderType === 'takeaway'
            ? 'Failed to mark takeaway order as picked up.'
            : 'Failed to mark this delivery order as completed.')
      );
    } finally {
      setMarkingCollectedId(null);
    }
  };

  const markTakeawayReady = async (order) => {
    const currentStatus = statusKey(order?.status);
    const orderType = String(order?.order_type || 'delivery').toLowerCase();

    if (orderType !== 'takeaway') {
      setError('This action is only available for takeaway orders.');
      return;
    }

    if (!['accepted', 'preparing', 'ready'].includes(currentStatus)) {
      setError('Only accepted or preparing takeaway orders can be marked ready.');
      return;
    }

    setMarkingTakeawayReadyId(order.id);
    try {
      await restaurantApi.markTakeawayReady(order.id);
      await loadOrders();
      setStatusFilter('out_for_delivery');
      if (selectedOrder?.id === order.id) {
        closeOrderDetails();
      }
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to mark takeaway order as ready.');
    } finally {
      setMarkingTakeawayReadyId(null);
    }
  };

  const openOrderDetails = (order) => {
    setSelectedOrder(order);
  };

  const closeOrderDetails = () => {
    setSelectedOrder(null);
  };

  const filteredOrders = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    return orders.filter((order) => {
      const statusMatches = matchesStatusFilter(order.status, statusFilter);
      const customer = String(getCustomerName(order)).toLowerCase();
      const orderId = String(order.id).toLowerCase();
      const summary = String(getOrderSummary(order)).toLowerCase();
      const searchMatches = !search || customer.includes(search) || orderId.includes(search) || summary.includes(search);

      return statusMatches && searchMatches;
    });
  }, [orders, searchText, statusFilter]);

  const statusTabs = useMemo(() => {
    const counts = {
      ALL: orders.length,
      PENDING: orders.filter((order) => statusKey(order.status) === 'pending').length,
      PREPARING: orders.filter((order) => ['accepted', 'preparing', 'ready'].includes(statusKey(order.status))).length,
      OUT_FOR_DELIVERY: orders.filter((order) => statusKey(order.status) === 'out_for_delivery').length,
      COMPLETED: orders.filter((order) => statusKey(order.status) === 'delivered').length,
    };

    return [
      { label: 'All', value: '', count: counts.ALL },
      { label: 'Pending', value: 'pending', count: counts.PENDING },
      { label: 'Preparing', value: 'preparing', count: counts.PREPARING },
      { label: 'Out for Delivery', value: 'out_for_delivery', count: counts.OUT_FOR_DELIVERY },
      { label: 'Completed', value: 'delivered', count: counts.COMPLETED },
    ];
  }, [orders]);

  const stats = useMemo(() => {
    const todayOrders = filteredOrders.length;
    const revenue = filteredOrders
      .filter((order) => statusKey(order.status) === 'delivered')
      .reduce((sum, order) => sum + getOrderTotal(order), 0);

    const activeOrders = filteredOrders.filter((order) =>
      ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery'].includes(statusKey(order.status))
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
        value: filteredOrders.filter((order) => statusKey(order.status) === 'pending').length,
        color: '#f4b43a',
      },
      {
        name: 'Preparing',
        value: filteredOrders.filter((order) => ['accepted', 'preparing', 'ready'].includes(statusKey(order.status))).length,
        color: '#f28c28',
      },
      {
        name: 'Out for delivery',
        value: filteredOrders.filter((order) => statusKey(order.status) === 'out_for_delivery').length,
        color: '#4f7cf7',
      },
      {
        name: 'Completed',
        value: filteredOrders.filter((order) => statusKey(order.status) === 'delivered').length,
        color: '#49b454',
      },
    ];

    return rows.map((row) => ({
      ...row,
      percent: Math.round((row.value / total) * 100),
    }));
  }, [filteredOrders]);

  const chartFocusName = useMemo(() => {
    const filterToLabel = {
      pending: 'Pending',
      preparing: 'Preparing',
      out_for_delivery: 'Out for delivery',
      delivered: 'Completed',
    };

    if (filterToLabel[statusFilter]) {
      return filterToLabel[statusFilter];
    }

    const highest = pieData.reduce(
      (best, current) => (current.value > best.value ? current : best),
      pieData[0] || { name: 'Pending', value: 0 }
    );

    return highest?.name || 'Pending';
  }, [pieData, statusFilter]);

  const chartFocus = pieData.find((item) => item.name === chartFocusName) || {
    name: chartFocusName,
    value: 0,
    percent: 0,
  };

  const studentProfiles = useMemo(() => {
    const profileMap = new Map();

    filteredOrders.forEach((order) => {
      const name = getCustomerName(order);
      const key = String(order.student_id || order.customer_id || name).toLowerCase();
      const currentTotal = getOrderTotal(order);
      const existing = profileMap.get(key);

      if (!existing) {
        profileMap.set(key, {
          key,
          name,
          avatar: getCustomerAvatar(order),
          initials: getInitials(name),
          contact: getCustomerContact(order) || 'Regular student customer',
          ordersCount: 1,
          totalSpend: currentTotal,
          latestOrderId: order.id,
          latestStatus: order.status,
        });
        return;
      }

      existing.ordersCount += 1;
      existing.totalSpend += currentTotal;

      const currentOrderId = Number(order.id || 0);
      const latestOrderId = Number(existing.latestOrderId || 0);

      if (currentOrderId >= latestOrderId) {
        existing.latestOrderId = order.id;
        existing.latestStatus = order.status;
        existing.contact = getCustomerContact(order) || existing.contact;
        if (!existing.avatar) {
          existing.avatar = getCustomerAvatar(order);
        }
      }
    });

    return Array.from(profileMap.values())
      .sort((a, b) => {
        if (b.ordersCount !== a.ordersCount) {
          return b.ordersCount - a.ordersCount;
        }
        return b.totalSpend - a.totalSpend;
      })
      .slice(0, 4);
  }, [filteredOrders]);

  const serviceInsights = useMemo(() => {
    const deliveryOrders = filteredOrders.filter(
      (order) => String(order.order_type || 'delivery').toLowerCase() === 'delivery'
    ).length;
    const pickupOrders = Math.max(filteredOrders.length - deliveryOrders, 0);
    const readyForHandoff = filteredOrders.filter((order) => statusKey(order.status) === 'ready').length;
    const uniqueStudents = new Set(
      filteredOrders.map((order) => String(order.student_id || order.customer_id || getCustomerName(order)))
    ).size;
    const avgOrderValue = filteredOrders.length
      ? Math.round(filteredOrders.reduce((sum, order) => sum + getOrderTotal(order), 0) / filteredOrders.length)
      : 0;

    return [
      {
        label: 'Active Students',
        value: uniqueStudents || '0',
        note: 'Students placing orders in current view',
      },
      {
        label: 'Delivery Mix',
        value: `${deliveryOrders} delivery / ${pickupOrders} pickup`,
        note: filteredOrders.length
          ? `${Math.round((deliveryOrders / filteredOrders.length) * 100)}% delivery share`
          : 'No active orders',
      },
      {
        label: 'Average Order Value',
        value: `LKR ${avgOrderValue.toLocaleString()}`,
        note: `${filteredOrders.length} filtered orders`,
      },
      {
        label: 'Ready To Handoff',
        value: String(readyForHandoff),
        note: 'Orders packed and waiting for rider',
      },
    ];
  }, [filteredOrders]);

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
            detailClass="warm"
          />
          <KpiMiniCard
            label="Revenue View"
            value={`LKR ${stats.revenue.toLocaleString()}`}
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
                  filteredOrders.map((order) => (
                    <OrderRow
                      key={order.id}
                      order={order}
                      onAccept={acceptOrder}
                      onReject={rejectOrder}
                      onView={openOrderDetails}
                      onMarkTakeawayReady={markTakeawayReady}
                      markingTakeawayReadyId={markingTakeawayReadyId}
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
                <strong>{chartFocus.percent}%</strong>
                <span>{chartFocus.name}</span>
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

          <section className="section-card restaurant-student-profiles-card">
            <h3 className="section-title">Student Profiles</h3>

            <div className="restaurant-student-profiles-list">
              {studentProfiles.length ? (
                studentProfiles.map((profile) => (
                  <article key={profile.key} className="restaurant-student-profile-item">
                    <div className="restaurant-student-profile-item__head">
                      {profile.avatar ? (
                        <img src={profile.avatar} alt={profile.name} />
                      ) : (
                        <span className="restaurant-student-profile-item__avatar-fallback">
                          {profile.initials}
                        </span>
                      )}
                      <div>
                        <h4>{profile.name}</h4>
                        <p>{profile.contact}</p>
                      </div>
                    </div>

                    <div className="restaurant-student-profile-item__stats">
                      <span>{profile.ordersCount} orders</span>
                      <strong>LKR {profile.totalSpend.toLocaleString()}</strong>
                    </div>

                    <div className="restaurant-student-profile-item__status">
                      <small>Latest order #{profile.latestOrderId}</small>
                      <StatusBadge status={profile.latestStatus} />
                    </div>
                  </article>
                ))
              ) : (
                <p className="restaurant-orders-side-list__empty">
                  No student activity found for this filter.
                </p>
              )}
            </div>
          </section>
        </aside>
      </div>

      <div className="dashboard-bottom-split">
        <section className="section-card restaurant-orders-insights-card">
          <div className="section-header">
            <h3 className="section-title">Service Insights</h3>
          </div>

          <div className="restaurant-orders-insights-grid">
            {serviceInsights.map((insight) => (
              <article key={insight.label} className="restaurant-orders-insight-item">
                <p>{insight.label}</p>
                <strong>{insight.value}</strong>
                <span>{insight.note}</span>
              </article>
            ))}
          </div>
        </section>
      </div>

      {selectedOrder ? (
        <div className="restaurant-order-modal-backdrop" onClick={closeOrderDetails}>
          <section className="restaurant-order-modal" onClick={(event) => event.stopPropagation()}>
            <header className="restaurant-order-modal__header">
              <div>
                <p>Order Details</p>
                <h3>Order #{selectedOrder.id}</h3>
              </div>
              <button type="button" onClick={closeOrderDetails}>Close</button>
            </header>

            <div className="restaurant-order-modal__profile">
              <div className="restaurant-order-modal__customer">
                {getCustomerAvatar(selectedOrder) ? (
                  <img
                    src={getCustomerAvatar(selectedOrder)}
                    alt={getCustomerName(selectedOrder)}
                  />
                ) : (
                  <span>{getInitials(getCustomerName(selectedOrder))}</span>
                )}
                <div>
                  <h4>{getCustomerName(selectedOrder)}</h4>
                  <p>{getCustomerContact(selectedOrder) || 'Student customer'}</p>
                </div>
              </div>
              <div className="restaurant-order-modal__badges">
                <StatusBadge status={selectedOrder.status} />
                <strong>LKR {getOrderTotal(selectedOrder).toLocaleString()}</strong>
              </div>
            </div>

            {getDeliveryPartnerName(selectedOrder) ? (
              <div className="restaurant-order-modal__profile">
                <div className="restaurant-order-modal__customer">
                  {getDeliveryPartnerAvatar(selectedOrder) ? (
                    <img
                      src={getDeliveryPartnerAvatar(selectedOrder)}
                      alt={getDeliveryPartnerName(selectedOrder)}
                    />
                  ) : (
                    <span>{getInitials(getDeliveryPartnerName(selectedOrder))}</span>
                  )}
                  <div>
                    <h4>{getDeliveryPartnerName(selectedOrder)}</h4>
                    <p>{getDeliveryPartnerPhone(selectedOrder) || 'Delivery partner'}</p>
                    {getDeliveryPartnerVehicle(selectedOrder) ? (
                      <p>{getDeliveryPartnerVehicle(selectedOrder)}</p>
                    ) : null}
                  </div>
                </div>
                <div className="restaurant-order-modal__badges">
                  <strong>Delivery Partner</strong>
                </div>
              </div>
            ) : null}

            <div className="restaurant-order-modal__meta">
              <span>{getOrderItemsCount(selectedOrder)} items</span>
              <span>{String(selectedOrder.order_type || 'delivery').toUpperCase()}</span>
              {selectedOrder.route_distance_km ? <span>{Number(selectedOrder.route_distance_km).toFixed(2)} km</span> : null}
              {selectedOrder.estimated_delivery_time ? <span>ETA {selectedOrder.estimated_delivery_time} min</span> : null}
              {String(selectedOrder.order_type || 'delivery').toLowerCase() === 'takeaway' &&
              ['accepted', 'preparing', 'ready'].includes(statusKey(selectedOrder.status)) ? (
                <span>Preparing takeaway order</span>
              ) : null}
            </div>

            {statusKey(selectedOrder.status) === 'out_for_delivery' ? (
              <div className="restaurant-order-modal__actions">
                <button
                  type="button"
                  className="restaurant-orders-action-btn"
                  onClick={() => markOrderCollected(selectedOrder)}
                  disabled={markingCollectedId === selectedOrder.id}
                >
                  <CheckCircle2 size={15} />
                  <span>
                    {markingCollectedId === selectedOrder.id
                      ? 'Updating...'
                      : String(selectedOrder.order_type || 'delivery').toLowerCase() === 'takeaway'
                        ? 'Student Picked Up - Move to Completed'
                        : 'Delivery Partner Collected - Move to Completed'}
                  </span>
                </button>
              </div>
            ) : null}

            {String(selectedOrder.order_type || 'delivery').toLowerCase() === 'takeaway' &&
            ['accepted', 'preparing', 'ready'].includes(statusKey(selectedOrder.status)) ? (
              <div className="restaurant-order-modal__actions">
                <button
                  type="button"
                  className="restaurant-orders-action-btn"
                  onClick={() => markTakeawayReady(selectedOrder)}
                  disabled={markingTakeawayReadyId === selectedOrder.id}
                >
                  <CheckCircle2 size={15} />
                  <span>
                    {markingTakeawayReadyId === selectedOrder.id
                      ? 'Updating...'
                      : 'Preparation Ready - Notify Student'}
                  </span>
                </button>
              </div>
            ) : null}

            <div className="restaurant-order-modal__items">
              {(selectedOrder.items?.length ? selectedOrder.items : [{ id: 'fallback-item' }]).map((item, index) => {
                const itemName =
                  item.menu_item?.name ||
                  item.name ||
                  item.food_item_name ||
                  item.food_name ||
                  getOrderSummary(selectedOrder);
                const quantity = Number(item.quantity || item.qty || item.count || 1);
                const itemPrice = Number(
                  item.total_price ||
                  item.price ||
                  item.unit_price ||
                  item.menu_item?.price ||
                  0
                );
                const itemImage =
                  item.menu_item?.image_url ||
                  item.menu_item?.image ||
                  item.image_url ||
                  item.image ||
                  mockFoodImages[index % mockFoodImages.length];

                return (
                  <article key={item.id || `${selectedOrder.id}-${index}`} className="restaurant-order-modal__item">
                    <img src={itemImage} alt={itemName} />
                    <div>
                      <h5>{itemName}</h5>
                      <p>Qty: {quantity}</p>
                    </div>
                    <strong>{itemPrice ? `LKR ${itemPrice.toLocaleString()}` : '-'}</strong>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
