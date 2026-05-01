import React from "react";
import { Alert } from "react-native";
import ScreenContainer from "../../../../components/common/ScreenContainer";
import EmptyState from "../../../../components/common/EmptyState";
import LoadingOverlay from "../../../../components/common/LoadingOverlay";
import BookingRequestCard from "../../components/requests/BookingRequestCard";
import { useOwnerListings } from "../../context/OwnerListingsContext";

export default function BookingRequestsScreen() {
  const { bookingRequests, listings, loading, setRequestStatus } = useOwnerListings();

  if (loading) {
    return <LoadingOverlay />;
  }

  if (bookingRequests.length === 0) {
    return (
      <ScreenContainer>
        <EmptyState
          title="No booking requests"
          description="Student enquiries and booking requests will appear here when they arrive."
          icon="mail-outline"
        />
      </ScreenContainer>
    );
  }

  async function updateStatus(requestId, status) {
    const result = await setRequestStatus(requestId, status);
    if (!result.success) {
      Alert.alert("Update Failed", result.message);
    }
  }

  return (
    <ScreenContainer>
      {bookingRequests.map((request) => {
        const room = listings.find((listing) => listing.id === request.roomId);
        return (
          <BookingRequestCard
            key={request.id}
            request={request}
            roomTitle={room?.title || request.roomTitle || "Room not found"}
            onApprove={() => updateStatus(request.id, "Approved")}
            onReject={() => updateStatus(request.id, "Rejected")}
          />
        );
      })}
    </ScreenContainer>
  );
}
