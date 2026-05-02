import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ScreenContainer from "../../components/common/ScreenContainer";
import AppButton from "../../components/common/AppButton";
import EmptyState from "../../components/common/EmptyState";
import { useBookingPayment } from "../../context/BookingPaymentContext";
import { appTheme } from "../../theme";
import { formatCurrency } from "../../utils/format";

function formatPaymentDate(isoDate) {
  if (!isoDate) {
    return "";
  }

  return new Date(isoDate).toLocaleString();
}

export default function PaymentSuccessScreen({ navigation }) {
  const {
    selectedRoom,
    advanceAmount,
    selectedPaymentMethod,
    paymentReceipt,
    latestBookingRequest,
    resetBookingFlow,
  } = useBookingPayment();
  const isCashOnArrival = selectedPaymentMethod === "cash";

  function navigateToDashboard() {
    navigation.getParent()?.navigate("HomeTab", { screen: "StudentHome" });
  }

  if (!selectedRoom || !paymentReceipt) {
    return (
      <ScreenContainer>
        <EmptyState
          title="No payment found"
          description="Your payment summary is unavailable. Please return to the dashboard."
          icon="checkmark-circle-outline"
        />
        <AppButton title="Go to Dashboard" onPress={navigateToDashboard} />
      </ScreenContainer>
    );
  }

  function handleGoToDashboard() {
    resetBookingFlow();
    navigateToDashboard();
  }

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark" size={34} color="#FFFFFF" />
        </View>
        <Text style={styles.heroTitle}>
          {isCashOnArrival ? "Booking Request Sent" : "Payment Successful"}
        </Text>
        <Text style={styles.heroSubtitle}>
          {isCashOnArrival
            ? "Your booking request has been sent to the room owner and is now pending approval."
            : "Your advance payment has been recorded and your booking request is now pending owner approval."}
        </Text>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.label}>Room</Text>
          <Text style={styles.value}>{selectedRoom.title}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.label}>{isCashOnArrival ? "Advance amount" : "Amount paid"}</Text>
          <Text style={styles.value}>{formatCurrency(advanceAmount)}</Text>
        </View>
        {isCashOnArrival ? (
          <View style={styles.summaryRow}>
            <Text style={styles.label}>Payment method</Text>
            <Text style={styles.value}>Cash on Arrival</Text>
          </View>
        ) : (
          <>
            <View style={styles.summaryRow}>
              <Text style={styles.label}>Transaction ID</Text>
              <Text style={styles.value}>{paymentReceipt.transactionId}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.label}>Date</Text>
              <Text style={styles.value}>{formatPaymentDate(paymentReceipt.paidAt)}</Text>
            </View>
          </>
        )}
        <View style={styles.summaryRow}>
          <Text style={styles.label}>Booking status</Text>
          <Text style={styles.value}>{latestBookingRequest?.bookingStatusLabel || "Pending Approval"}</Text>
        </View>
      </View>

      <View style={styles.messageCard}>
        <Text style={styles.messageTitle}>
          {isCashOnArrival ? "Owner review is pending" : "Booking confirmed in the app"}
        </Text>
        <Text style={styles.messageText}>
          {isCashOnArrival
            ? "We saved your booking request, and the room owner can now review it from their dashboard."
            : "We saved your booking request with payment details, and the room owner can now review it from their dashboard."}
        </Text>
      </View>

      <AppButton title="Go to Dashboard" onPress={handleGoToDashboard} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: "center",
  },
  heroCard: {
    alignItems: "center",
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.xl,
    gap: appTheme.spacing.md,
    borderWidth: 1,
    borderColor: "#E3EBF2",
    ...appTheme.shadow,
  },
  successIcon: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: appTheme.colors.success,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: appTheme.colors.text,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: appTheme.colors.textMuted,
    textAlign: "center",
  },
  summaryCard: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.md,
    borderWidth: 1,
    borderColor: "#E3EBF2",
    ...appTheme.shadow,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: appTheme.spacing.md,
  },
  label: {
    flex: 1,
    fontSize: 13,
    color: appTheme.colors.textMuted,
  },
  value: {
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
    color: appTheme.colors.text,
    textAlign: "right",
  },
  messageCard: {
    backgroundColor: "#F3FAFC",
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.sm,
    borderWidth: 1,
    borderColor: "#D3E8F0",
  },
  messageTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: appTheme.colors.text,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 21,
    color: appTheme.colors.textMuted,
  },
});
