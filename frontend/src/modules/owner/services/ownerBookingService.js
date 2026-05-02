import {
  fetchBookingRequestsByOwner,
  updateBookingRequestStatus as updateSharedBookingRequestStatus,
} from "../../../services/bookingRequestService";

export async function fetchBookingRequests() {
  return fetchBookingRequestsByOwner();
}

export async function updateBookingRequestStatus(requestId, status) {
  return updateSharedBookingRequestStatus(requestId, status);
}
