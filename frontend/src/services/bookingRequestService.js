import apiClient from "./apiClient";

function toTitleCaseStatus(status = "") {
  const normalizedStatus = String(status || "").trim().toLowerCase();

  switch (normalizedStatus) {
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "cancelled":
      return "Cancelled";
    default:
      return "Pending";
  }
}

function toApiStatus(status = "") {
  const normalizedStatus = String(status || "").trim().toLowerCase();

  if (["approved", "rejected", "cancelled", "pending"].includes(normalizedStatus)) {
    return normalizedStatus;
  }

  return "pending";
}

function normalizeBookingRequest(request = {}) {
  const room = request.room || {};
  const owner = request.owner || {};
  const student = request.student || {};
  const ownerUser = owner.user || {};
  const studentUser = student.user || {};
  const normalizedStatus = toTitleCaseStatus(request.status);

  return {
    id: request._id || request.id,
    roomId: room._id || room.id || request.roomId || "",
    roomTitle: room.title || request.roomTitle || "Room Booking Request",
    ownerId: owner._id || owner.id || request.ownerId || "",
    ownerName: ownerUser.name || request.ownerName || "",
    ownerContact: ownerUser.phone || ownerUser.email || request.ownerContact || "",
    studentId: student._id || student.id || request.studentId || "",
    studentName: studentUser.name || request.studentName || "Student",
    studentContact: studentUser.email || studentUser.phone || request.studentContact || "",
    moveInDate: request.moveInDate || null,
    requestedAt: request.createdAt || request.requestedAt || new Date().toISOString(),
    reviewedAt: request.updatedAt || request.reviewedAt || null,
    message: request.message || "",
    status: normalizedStatus,
    bookingStatusLabel: request.bookingStatusLabel || normalizedStatus,
    paymentStatus: request.paymentStatus || "",
    paymentMethod: request.paymentMethod || "",
    advanceAmount: Number(request.advanceAmount || 0),
    transactionId: request.transactionId || "",
    paidAt: request.paidAt || null,
    ownerNotes: request.ownerNotes || "",
  };
}

function buildDefaultMoveInDate() {
  return new Date().toISOString();
}

export async function fetchBookingRequestsByOwner() {
  const response = await apiClient.get("/owners/bookings");
  return (response.data.data || []).map(normalizeBookingRequest);
}

export async function fetchBookingRequestsByStudent() {
  const response = await apiClient.get("/bookings/my");
  return (response.data.data || []).map(normalizeBookingRequest);
}

export async function createBookingRequest(payload) {
  const response = await apiClient.post("/bookings", {
    roomId: payload.roomId,
    moveInDate: payload.moveInDate || buildDefaultMoveInDate(),
    message: payload.message || "",
    paymentStatus: payload.paymentStatus || "",
    paymentMethod: payload.paymentMethod || "",
    advanceAmount: payload.advanceAmount || 0,
    transactionId: payload.transactionId || "",
    paidAt: payload.paidAt || null,
  });

  return normalizeBookingRequest(response.data.data);
}

export async function updateBookingRequestStatus(requestId, status, ownerNotes = "") {
  const response = await apiClient.patch(`/bookings/${requestId}/status`, {
    status: toApiStatus(status),
    ownerNotes,
  });

  return normalizeBookingRequest(response.data.data);
}
