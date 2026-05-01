import React, { useMemo, useState } from "react";
import { Alert, Image, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import ScreenContainer from "../../components/common/ScreenContainer";
import AppButton from "../../components/common/AppButton";
import PaymentCardInput from "../../components/payment/PaymentCardInput";
import PaymentOptionCard from "../../components/payment/PaymentOptionCard";
import EmptyState from "../../components/common/EmptyState";
import { useAuth } from "../../context/AuthContext";
import { useBookingPayment } from "../../context/BookingPaymentContext";
import { appTheme } from "../../theme";
import { formatCurrency } from "../../utils/format";

const paymentOptions = [
  {
    id: "card",
    title: "Credit / Debit Card",
    subtitle: "Pay securely now and confirm your booking request",
    icon: "card-outline",
  },
  {
    id: "bank",
    title: "Bank Transfer",
    subtitle: "Mock direct transfer for advance room payment",
    icon: "business-outline",
  },
  {
    id: "cash",
    title: "Cash on Arrival",
    subtitle: "Reserve first and pay your advance during check-in",
    icon: "cash-outline",
  },
];

function formatCardNumber(value) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function validateForm(paymentMethod, values) {
  const nextErrors = {};

  if (paymentMethod !== "card") {
    return nextErrors;
  }

  if (!values.cardHolderName.trim()) {
    nextErrors.cardHolderName = "Card holder name is required.";
  }

  if (values.cardNumber.replace(/\s/g, "").length !== 16) {
    nextErrors.cardNumber = "Enter a valid 16-digit card number.";
  }

  if (!/^\d{2}\/\d{2}$/.test(values.expiryDate)) {
    nextErrors.expiryDate = "Enter expiry in MM/YY format.";
  }

  if (!/^\d{3,4}$/.test(values.cvv)) {
    nextErrors.cvv = "Enter a valid CVV.";
  }

  return nextErrors;
}

export default function PaymentMethodScreen({ navigation }) {
  const { user } = useAuth();
  const {
    selectedRoom,
    advanceAmount,
    paymentStatus,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    confirmBookingPayment,
  } = useBookingPayment();
  const [cardValues, setCardValues] = useState({
    cardHolderName: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  });
  const [errors, setErrors] = useState({});

  const monthlyRentLabel = useMemo(
    () => (selectedRoom ? `${formatCurrency(selectedRoom.price)} / month` : ""),
    [selectedRoom]
  );

  if (!selectedRoom) {
    return (
      <ScreenContainer>
        <EmptyState
          title="No room selected"
          description="Please return to room details and start the booking flow again."
          icon="card-outline"
        />
        <AppButton title="Back to rooms" onPress={() => navigation.goBack()} />
      </ScreenContainer>
    );
  }

  function handleCardChange(field, value) {
    let nextValue = value;

    if (field === "cardNumber") {
      nextValue = formatCardNumber(value);
    }

    if (field === "expiryDate") {
      nextValue = formatExpiry(value);
    }

    if (field === "cvv") {
      nextValue = value.replace(/\D/g, "");
    }

    setCardValues((current) => ({
      ...current,
      [field]: nextValue,
    }));

    setErrors((current) => ({
      ...current,
      [field]: "",
    }));
  }

  async function handlePayment() {
    const formErrors = validateForm(selectedPaymentMethod, cardValues);
    setErrors(formErrors);

    if (Object.keys(formErrors).length > 0) {
      return;
    }

    try {
      await confirmBookingPayment({
        user,
        paymentMethod: selectedPaymentMethod,
        cardDetails: cardValues,
      });

      navigation.replace("PaymentSuccess");
    } catch (error) {
      Alert.alert("Payment Failed", error.message || "Unable to process payment right now.");
    }
  }

  return (
    <ScreenContainer>
      <LinearGradient
        colors={["#0B5D7A", "#0F7894", "#E48E2C"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <Text style={styles.heroLabel}>Advance payment required</Text>
        <Text style={styles.heroAmount}>{formatCurrency(advanceAmount)}</Text>
        <Text style={styles.heroSubtitle}>
          Secure this room by paying the advance before we send your booking request.
        </Text>
      </LinearGradient>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Image source={{ uri: selectedRoom.images[0] }} style={styles.roomImage} />
          <View style={styles.summaryCopy}>
            <Text style={styles.summaryTitle}>{selectedRoom.title}</Text>
            <Text style={styles.summaryMeta}>{selectedRoom.location}</Text>
            <Text style={styles.summaryPrice}>{monthlyRentLabel}</Text>
          </View>
        </View>
        <View style={styles.summaryFooter}>
          <View style={styles.summaryMetric}>
            <Ionicons name="wallet-outline" size={16} color={appTheme.colors.primary} />
            <Text style={styles.summaryMetricText}>Advance {formatCurrency(advanceAmount)}</Text>
          </View>
          <View style={styles.summaryMetric}>
            <Ionicons name="document-text-outline" size={16} color={appTheme.colors.warning} />
            <Text style={styles.summaryMetricText}>Pending approval after payment</Text>
          </View>
        </View>
      </View>

      <View style={styles.optionGroup}>
        <Text style={styles.sectionTitle}>Choose payment method</Text>
        {paymentOptions.map((option) => (
          <PaymentOptionCard
            key={option.id}
            title={option.title}
            subtitle={option.subtitle}
            icon={option.icon}
            selected={selectedPaymentMethod === option.id}
            onPress={() => setSelectedPaymentMethod(option.id)}
          />
        ))}
      </View>

      {selectedPaymentMethod === "card" ? (
        <PaymentCardInput
          values={cardValues}
          errors={errors}
          onChange={handleCardChange}
        />
      ) : (
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={appTheme.colors.primary} />
          <Text style={styles.infoText}>
            {selectedPaymentMethod === "bank"
              ? "This is a mock bank transfer flow. Tapping the button will simulate payment confirmation after 2 seconds."
              : "This mock cash-on-arrival option still reserves the booking flow and sends a request to the owner with payment intent."}
          </Text>
        </View>
      )}

      <AppButton
        title={paymentStatus === "processing" ? "Processing payment..." : "Pay & Confirm Booking"}
        onPress={handlePayment}
        loading={paymentStatus === "processing"}
      />
      <AppButton
        title="Back to room"
        variant="secondary"
        onPress={() => navigation.goBack()}
        disabled={paymentStatus === "processing"}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.sm,
  },
  heroLabel: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  heroAmount: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "900",
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 14,
    lineHeight: 20,
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
    gap: appTheme.spacing.md,
  },
  roomImage: {
    width: 84,
    height: 84,
    borderRadius: appTheme.radius.md,
  },
  summaryCopy: {
    flex: 1,
    gap: 6,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: appTheme.colors.text,
  },
  summaryMeta: {
    fontSize: 13,
    color: appTheme.colors.textMuted,
  },
  summaryPrice: {
    fontSize: 15,
    fontWeight: "800",
    color: appTheme.colors.primary,
  },
  summaryFooter: {
    gap: appTheme.spacing.sm,
  },
  summaryMetric: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  summaryMetricText: {
    fontSize: 13,
    color: appTheme.colors.textMuted,
  },
  optionGroup: {
    gap: appTheme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: appTheme.colors.text,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: appTheme.spacing.sm,
    backgroundColor: "#F3FAFC",
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.md,
    borderWidth: 1,
    borderColor: "#D3E8F0",
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: appTheme.colors.textMuted,
  },
});
