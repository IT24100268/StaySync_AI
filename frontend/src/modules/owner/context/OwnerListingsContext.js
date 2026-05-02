import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRoleAuth } from "../../../context/RoleAuthContext";
import {
  createOwnerListing,
  deleteOwnerListing,
  fetchOwnerListings,
  updateOwnerListingAvailability,
  updateOwnerListing,
} from "../services/ownerRoomService";
import {
  fetchBookingRequests,
  updateBookingRequestStatus,
} from "../services/ownerBookingService";

const OwnerListingsContext = createContext(null);

export function OwnerListingsProvider({ children }) {
  const { user: sharedUser, token: sharedToken } = useRoleAuth();
  const [listings, setListings] = useState([]);
  const [bookingRequests, setBookingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (sharedToken && sharedUser?.role === "owner") {
      loadDashboardData();
    }
  }, [sharedToken, sharedUser?.id]);

  async function loadDashboardData() {
    try {
      setLoading(true);
      const ownerId = sharedUser?.role === "owner" ? sharedUser.id : undefined;
      const [listingResponse, bookingResponse] = await Promise.all([
        fetchOwnerListings(),
        fetchBookingRequests(ownerId),
      ]);
      setListings(listingResponse);
      setBookingRequests(bookingResponse);
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Unable to load owner dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  async function addListing(payload) {
    setSubmitting(true);
    try {
      const createdListing = await createOwnerListing(payload);
      setListings((current) => [createdListing, ...current]);
      return { success: true, listing: createdListing };
    } catch (submitError) {
      return { success: false, message: submitError.message || "Unable to add listing." };
    } finally {
      setSubmitting(false);
    }
  }

  async function editListing(payload) {
    setSubmitting(true);
    try {
      const updatedListing = await updateOwnerListing(payload);
      setListings((current) =>
        current.map((listing) => (listing.id === payload.id ? updatedListing : listing))
      );
      return { success: true, listing: updatedListing };
    } catch (submitError) {
      return { success: false, message: submitError.message || "Unable to update listing." };
    } finally {
      setSubmitting(false);
    }
  }

  async function removeListing(listingId) {
    setSubmitting(true);
    try {
      await deleteOwnerListing(listingId);
      setListings((current) => current.filter((listing) => listing.id !== listingId));
      return { success: true };
    } catch (submitError) {
      return { success: false, message: submitError.message || "Unable to delete listing." };
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleListingStatus(listingId) {
    const listing = listings.find((item) => item.id === listingId);
    if (!listing) {
      return { success: false, message: "Listing not found." };
    }

    setSubmitting(true);
    try {
      const updatedListing = await updateOwnerListingAvailability(
        listingId,
        listing.status !== "available"
      );
      setListings((current) =>
        current.map((item) => (item.id === listingId ? updatedListing : item))
      );
      return { success: true, listing: updatedListing };
    } catch (submitError) {
      return { success: false, message: submitError.message || "Unable to update listing status." };
    } finally {
      setSubmitting(false);
    }
  }

  async function setRequestStatus(requestId, status) {
    try {
      const updatedRequest = await updateBookingRequestStatus(requestId, status);
      setBookingRequests((current) =>
        current.map((request) =>
          request.id === requestId ? updatedRequest : request
        )
      );
      return { success: true };
    } catch (submitError) {
      return { success: false, message: submitError.message || "Unable to update request." };
    }
  }

  const analytics = useMemo(() => {
    const totalListings = listings.length;
    const availableRooms = listings.filter((listing) => listing.status === "available").length;
    const unavailableRooms = totalListings - availableRooms;
    const totalEnquiries = listings.reduce(
      (sum, listing) => sum + Number(listing.enquiriesCount || 0),
      0
    );
    const totalBookingRequests = bookingRequests.length;
    const totalEarnings = bookingRequests.reduce((sum, request) => {
      if (request.status !== "Approved") {
        return sum;
      }

      return sum + Number(request.advanceAmount || 0);
    }, 0);

    return {
      totalListings,
      availableRooms,
      unavailableRooms,
      totalEnquiries,
      totalEarnings,
      totalBookingRequests,
    };
  }, [bookingRequests, listings]);

  const value = useMemo(
    () => ({
      listings,
      bookingRequests,
      analytics,
      loading,
      submitting,
      error,
      loadDashboardData,
      addListing,
      editListing,
      removeListing,
      toggleListingStatus,
      setRequestStatus,
    }),
    [analytics, bookingRequests, error, listings, loading, submitting]
  );

  return (
    <OwnerListingsContext.Provider value={value}>{children}</OwnerListingsContext.Provider>
  );
}

export function useOwnerListings() {
  const context = useContext(OwnerListingsContext);

  if (!context) {
    throw new Error("useOwnerListings must be used within OwnerListingsProvider");
  }

  return context;
}
