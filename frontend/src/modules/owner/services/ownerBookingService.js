import apiClient from "../../../services/apiClient";
import {
  fetchBookingRequestsByOwner,
  updateBookingRequestStatus as updateSharedBookingRequestStatus,
} from "../../../services/bookingRequestService";

export async function fetchBookingRequests(ownerId) {
  void apiClient;
  return fetchBookingRequestsByOwner(ownerId);
}

export async function updateBookingRequestStatus(requestId, status) {
  void apiClient;
  return updateSharedBookingRequestStatus(requestId, status);
}
