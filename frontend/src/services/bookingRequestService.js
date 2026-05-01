import { bookingRequests as seededBookingRequests } from "../modules/owner/data/dummyData";
import { STORAGE_KEYS } from "../utils/constants";
import { getSecureItem, setSecureItem } from "../utils/storage";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

async function getStoredBookingRequests() {
  const storedRequests = await getSecureItem(STORAGE_KEYS.bookingRequests);

  if (!storedRequests) {
    await setSecureItem(
      STORAGE_KEYS.bookingRequests,
      JSON.stringify(seededBookingRequests)
    );
    return clone(seededBookingRequests);
  }

  const parsedRequests = JSON.parse(storedRequests);
  const migratedRequests = parsedRequests.map((request) => ({
    ownerId: request.ownerId || "owner-1",
    roomTitle: request.roomTitle || "Room Booking Request",
    ...request,
  }));

  await saveStoredBookingRequests(migratedRequests);
  return migratedRequests;
}

async function saveStoredBookingRequests(requests) {
  await setSecureItem(STORAGE_KEYS.bookingRequests, JSON.stringify(requests));
}

function simulateNetwork(payload) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(payload), 350);
  });
}

export async function fetchBookingRequestsByOwner(ownerId) {
  const requests = await getStoredBookingRequests();

  if (!ownerId) {
    return simulateNetwork(clone(requests));
  }

  return simulateNetwork(
    clone(requests).filter((request) => request.ownerId === ownerId)
  );
}

export async function fetchBookingRequestsByStudent(studentId) {
  const requests = await getStoredBookingRequests();

  if (!studentId) {
    return simulateNetwork([]);
  }

  return simulateNetwork(
    clone(requests).filter((request) => request.studentId === studentId)
  );
}

export async function createBookingRequest(payload) {
  const requests = await getStoredBookingRequests();
  const existingRequest = requests.find(
    (request) =>
      request.studentId === payload.studentId &&
      request.roomId === payload.roomId &&
      request.status !== "Rejected"
  );

  if (existingRequest) {
    throw new Error(
      existingRequest.status === "Approved"
        ? "Your booking for this room is already approved."
        : "Your booking request for this room is already pending."
    );
  }

  const createdRequest = {
    id: `request-${Date.now()}`,
    requestedAt: new Date().toISOString(),
    status: "Pending",
    ...payload,
  };

  const nextRequests = [createdRequest, ...requests];
  await saveStoredBookingRequests(nextRequests);

  return simulateNetwork(clone(createdRequest));
}

export async function updateBookingRequestStatus(requestId, status) {
  const requests = await getStoredBookingRequests();
  const nextRequests = requests.map((request) =>
    request.id === requestId
      ? {
          ...request,
          status,
          reviewedAt: new Date().toISOString(),
        }
      : request
  );

  const updatedRequest = nextRequests.find((request) => request.id === requestId);

  await saveStoredBookingRequests(nextRequests);
  return simulateNetwork(clone(updatedRequest));
}
