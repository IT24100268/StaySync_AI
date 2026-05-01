import React, { useEffect, useState } from "react";
import { Alert, Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import ScreenContainer from "../../components/common/ScreenContainer";
import AppButton from "../../components/common/AppButton";
import EmptyState from "../../components/common/EmptyState";
import { useAuth } from "../../context/AuthContext";
import { useBookingPayment } from "../../context/BookingPaymentContext";
import { useRooms } from "../../context/RoomContext";
import {
  fetchBookingRequestsByStudent,
} from "../../services/bookingRequestService";
import { fetchRoomById } from "../../services/roomService";
import { appTheme } from "../../theme";
import { formatCurrency, formatDistance } from "../../utils/format";
import LoadingOverlay from "../../components/common/LoadingOverlay";
import { ROOM_REPORT_TYPES } from "../../constants/reports";

export default function RoomDetailScreen({ route, navigation }) {
  const { roomId } = route.params || {};
  const { user } = useAuth();
  const { startBookingFlow } = useBookingPayment();
  const { rooms, favouriteRoomIds, toggleFavourite } = useRooms();
  const [currentRequest, setCurrentRequest] = useState(null);
  const [remoteRoom, setRemoteRoom] = useState(null);
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [showContactModal, setShowContactModal] = useState(false);
  const room = rooms.find((item) => item.id === roomId) || remoteRoom;

  useEffect(() => {
    loadRoomDetails();
  }, [roomId, rooms]);

  useEffect(() => {
    loadCurrentBookingRequest();
  }, [roomId, user?.id]);

  async function loadRoomDetails() {
    if (!roomId) {
      setRemoteRoom(null);
      setLoadingRoom(false);
      return;
    }

    const matchedRoom = rooms.find((item) => item.id === roomId);
    if (matchedRoom) {
      setRemoteRoom(null);
      setLoadingRoom(false);
      return;
    }

    try {
      setLoadingRoom(true);
      const response = await fetchRoomById(roomId);
      setRemoteRoom(response);
    } catch (error) {
      setRemoteRoom(null);
    } finally {
      setLoadingRoom(false);
    }
  }

  async function loadCurrentBookingRequest() {
    if (!user?.id || !roomId) {
      setCurrentRequest(null);
      return;
    }

    const requests = await fetchBookingRequestsByStudent(user.id);
    const matchedRequest = requests.find((request) => request.roomId === roomId) || null;
    setCurrentRequest(matchedRequest);
  }

  if (loadingRoom) {
    return <LoadingOverlay />;
  }

  if (!room) {
    return (
      <ScreenContainer>
        <EmptyState
          title="Room unavailable"
          description="The selected room could not be found."
        />
      </ScreenContainer>
    );
  }

  async function handleBooking() {
    if (!user?.id) {
      Alert.alert("Login Required", "Please log in again before sending a booking request.");
      return;
    }

    startBookingFlow(room);
    navigation.navigate("PaymentMethod");
  }

  function handleContact() {
    setShowContactModal(true);
  }

  function getBookingButtonTitle() {
    if (currentRequest?.status === "Approved") {
      return "Booking Approved";
    }

    if (currentRequest?.status === "Pending") {
      return "Request Pending";
    }

    return "Booking Request";
  }

  return (
    <ScreenContainer>
      {room.images.map((image) => (
        <Image key={image} source={{ uri: image }} style={styles.image} />
      ))}

      <View style={styles.card}>
        <Text style={styles.title}>{room.title}</Text>
        <Text style={styles.price}>{formatCurrency(room.price)} / month</Text>
        <Text style={styles.meta}>{room.location}</Text>
        <Text style={styles.meta}>
          {formatDistance(room.distance)} • Allowed: {room.genderAllowed}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Facilities</Text>
        <View style={styles.wrap}>
          {room.facilities.map((facility) => (
            <View key={facility} style={styles.tag}>
              <Text style={styles.tagLabel}>{facility}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Rules</Text>
        {room.rules.map((rule) => (
          <Text key={rule} style={styles.rule}>
            • {rule}
          </Text>
        ))}
      </View>

      <AppButton
        title={
          favouriteRoomIds.includes(room.id)
            ? "Remove from Favourites"
            : "Save to Favourites"
        }
        variant="secondary"
        onPress={() => toggleFavourite(room.id)}
      />
      <View style={styles.actionGroup}>
        <AppButton title="Contact Owner" onPress={handleContact} />
        <AppButton
          title="Report Issue"
          variant="secondary"
          onPress={() =>
            navigation.navigate("ComplaintForm", {
              mode: "room",
              title: "Report a room issue",
              subtitle: "Let us know what is wrong with this listing or room.",
              targetId: room.id,
              initialType: "Room Issue",
              availableTypes: ROOM_REPORT_TYPES,
            })
          }
        />
      </View>
      {currentRequest ? (
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Booking status</Text>
          <Text style={styles.statusText}>
            {currentRequest.status === "Approved"
              ? "Your booking has been approved by the room owner."
              : currentRequest.status === "Rejected"
                ? "This request was rejected. You can explore other room options."
                : currentRequest.paymentStatus === "Paid"
                  ? "Your advance payment was completed and the booking is awaiting owner approval."
                  : "Your booking request has been sent and is awaiting owner approval."}
          </Text>
        </View>
      ) : null}
      <AppButton
        title={getBookingButtonTitle()}
        onPress={handleBooking}
        disabled={currentRequest?.status === "Pending" || currentRequest?.status === "Approved"}
      />
      <AppButton
        title="Back to Listings"
        variant="secondary"
        onPress={() => navigation.goBack()}
      />

      <Modal visible={showContactModal} transparent animationType="fade" onRequestClose={() => setShowContactModal(false)}>
        <View style={styles.overlay}>
          <Pressable style={styles.overlayFill} onPress={() => setShowContactModal(false)} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Owner Contact</Text>
            <Text style={styles.contactLine}>{room.ownerPhone || "Phone not available"}</Text>
            <AppButton title="Close" onPress={() => setShowContactModal(false)} />
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  image: {
    width: "100%",
    height: 220,
    borderRadius: appTheme.radius.lg,
  },
  card: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.sm,
    ...appTheme.shadow,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: appTheme.colors.text,
  },
  price: {
    fontSize: 18,
    fontWeight: "700",
    color: appTheme.colors.primary,
  },
  meta: {
    color: appTheme.colors.textMuted,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: appTheme.colors.text,
  },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tag: {
    backgroundColor: appTheme.colors.chipBg,
    borderRadius: appTheme.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: appTheme.spacing.sm,
    marginBottom: appTheme.spacing.sm,
  },
  tagLabel: {
    fontWeight: "600",
    color: appTheme.colors.primaryDark,
  },
  rule: {
    color: appTheme.colors.textMuted,
    lineHeight: 22,
  },
  statusCard: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.md,
    gap: appTheme.spacing.xs,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    ...appTheme.shadow,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: appTheme.colors.text,
  },
  statusText: {
    color: appTheme.colors.textMuted,
    lineHeight: 21,
  },
  actionGroup: {
    gap: appTheme.spacing.sm,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(16,24,38,0.45)",
    justifyContent: "center",
    padding: appTheme.spacing.lg,
  },
  overlayFill: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.md,
    ...appTheme.shadow,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: appTheme.colors.text,
  },
  contactLine: {
    color: appTheme.colors.textMuted,
    lineHeight: 22,
  },
});
