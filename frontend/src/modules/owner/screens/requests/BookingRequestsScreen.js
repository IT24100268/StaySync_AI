import React, { useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import AppButton from "../../../../components/common/AppButton";
import AppInput from "../../../../components/common/AppInput";
import ScreenContainer from "../../../../components/common/ScreenContainer";
import EmptyState from "../../../../components/common/EmptyState";
import LoadingOverlay from "../../../../components/common/LoadingOverlay";
import BookingRequestCard from "../../components/requests/BookingRequestCard";
import { useOwnerListings } from "../../context/OwnerListingsContext";
import { appTheme } from "../../../../theme";

export default function BookingRequestsScreen() {
  const { bookingRequests, listings, loading, setRequestStatus } = useOwnerListings();
  const [rejectingRequestId, setRejectingRequestId] = useState("");
  const [rejectReason, setRejectReason] = useState("");

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

  async function updateStatus(requestId, status, ownerNotes = "") {
    const result = await setRequestStatus(requestId, status, ownerNotes);
    if (!result.success) {
      Alert.alert("Update Failed", result.message);
    }
  }

  async function handleRejectSubmit() {
    const trimmedReason = rejectReason.trim();

    if (!trimmedReason) {
      Alert.alert("Reject Reason Required", "Please enter the reason for rejecting this booking request.");
      return;
    }

    await updateStatus(rejectingRequestId, "Rejected", trimmedReason);
    setRejectingRequestId("");
    setRejectReason("");
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
            onReject={() => {
              setRejectingRequestId(request.id);
              setRejectReason(request.ownerNotes || "");
            }}
          />
        );
      })}

      <Modal
        visible={Boolean(rejectingRequestId)}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setRejectingRequestId("");
          setRejectReason("");
        }}
      >
        <View style={styles.overlay}>
          <Pressable
            style={styles.dismissLayer}
            onPress={() => {
              setRejectingRequestId("");
              setRejectReason("");
            }}
          />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reject Booking Request</Text>
            <Text style={styles.modalSubtitle}>
              Add the rejection reason. This will be shown to the student in their dashboard notification.
            </Text>
            <AppInput
              label="Reject Reason"
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Enter rejection reason"
              multiline
            />
            <View style={styles.modalActions}>
              <AppButton
                title="Cancel"
                variant="secondary"
                onPress={() => {
                  setRejectingRequestId("");
                  setRejectReason("");
                }}
              />
              <AppButton title="Reject Request" onPress={handleRejectSubmit} />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(16,24,38,0.45)",
    justifyContent: "center",
    padding: appTheme.spacing.lg,
  },
  dismissLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.md,
  },
  modalTitle: {
    color: appTheme.colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  modalSubtitle: {
    color: appTheme.colors.textMuted,
    lineHeight: 20,
  },
  modalActions: {
    gap: appTheme.spacing.sm,
  },
});
