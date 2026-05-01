import apiClient from "../../../services/apiClient";

function toLabel(value, fallback = "None") {
  if (!value) {
    return fallback;
  }

  return String(value)
    .split("_")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function normalizeOrder(order) {
  return {
    id: order.id || order._id,
    orderId: order.orderId || order.id || order._id,
    orderCode: `#${String(order.orderId || order.id || order._id || "").slice(-8).toUpperCase()}`,
    studentName: order.studentName || "Student",
    restaurantName: order.restaurantName || "Restaurant",
    deliveryPartnerName: order.deliveryPartnerName || "Not Assigned",
    status: String(order.status || "ongoing").toLowerCase(),
    statusLabel: order.statusLabel || toLabel(order.status, "Ongoing"),
    disputeStatus: String(order.disputeStatus || "none").toLowerCase(),
    disputeStatusLabel: order.disputeStatusLabel || toLabel(order.disputeStatus, "None"),
    createdAt: order.createdAt || "",
    createdDateLabel:
      order.createdDateLabel ||
      (order.createdAt ? new Date(order.createdAt).toLocaleString() : ""),
    operationalStatus: String(order.operationalStatus || "").toLowerCase(),
    operationalStatusLabel: order.operationalStatusLabel || toLabel(order.operationalStatus, ""),
    totalAmount: Number(order.totalAmount || 0),
    deliveryFee: Number(order.deliveryFee || 0),
    deliveryAddress: order.deliveryAddress || "",
    failureReason: order.failureReason || "",
    timeline: Array.isArray(order.timeline) ? order.timeline : [],
    dispute: order.dispute || null,
  };
}

function normalizeTimelineItem(item) {
  return {
    key: item.key,
    label: item.label,
    completed: Boolean(item.completed),
    description: item.description || "",
    date: item.date || "",
    dateLabel: item.date ? new Date(item.date).toLocaleString() : "Pending",
  };
}

export async function fetchOrderMonitor() {
  const response = await apiClient.get("/admin/orders");
  return (response.data.data || []).map(normalizeOrder);
}

export async function fetchAdminOrderById(orderId) {
  const response = await apiClient.get(`/admin/orders/${orderId}`);
  const order = normalizeOrder(response.data.data || {});

  return {
    ...order,
    notes: response.data.data?.notes || "",
    items: (response.data.data?.items || []).map((item) => ({
      id: item.id || item._id,
      name: item.name || "Item",
      quantity: Number(item.quantity || 0),
      unitPrice: Number(item.unitPrice || 0),
      subtotal: Number(item.subtotal || 0),
    })),
    student: response.data.data?.student || null,
    restaurant: response.data.data?.restaurant || null,
    delivery: response.data.data?.delivery || null,
    timeline: (response.data.data?.timeline || []).map(normalizeTimelineItem),
    dispute: response.data.data?.dispute
      ? {
          ...response.data.data.dispute,
          status: String(response.data.data.dispute.status || "none").toLowerCase(),
          statusLabel:
            response.data.data.dispute.statusLabel ||
            toLabel(response.data.data.dispute.status, "None"),
          createdDateLabel: response.data.data.dispute.createdAt
            ? new Date(response.data.data.dispute.createdAt).toLocaleString()
            : "",
        }
      : null,
  };
}
