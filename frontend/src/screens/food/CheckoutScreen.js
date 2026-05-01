import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ScreenContainer from "../../components/common/ScreenContainer";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { createOrder, fetchDeliveryFeeEstimate } from "../../services/orderService";
import { appTheme } from "../../theme";
import { formatCurrency } from "../../utils/format";
import { validateRequired } from "../../utils/validation";

export default function CheckoutScreen({ navigation, route }) {
  const { user } = useAuth();
  const { items, total, clearCart } = useCart();
  const [orderType, setOrderType] = useState("delivery");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [pickupNote, setPickupNote] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [deliveryFeeBreakdown, setDeliveryFeeBreakdown] = useState(null);
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [quoteError, setQuoteError] = useState("");

  const restaurantId = items[0]?.restaurantId || "";
  const hasValidLocation =
    Number.isFinite(Number(deliveryLocation?.latitude)) &&
    Number.isFinite(Number(deliveryLocation?.longitude));
  const isDelivery = orderType === "delivery";
  const activeNote = isDelivery ? deliveryNote : pickupNote;
  const deliveryFee = isDelivery ? Number(deliveryFeeBreakdown?.totalFee || 0) : 0;
  const totalAmount = total + deliveryFee;
  const distanceKm = useMemo(
    () => Number(deliveryFeeBreakdown?.distanceKm || 0),
    [deliveryFeeBreakdown?.distanceKm]
  );

  useEffect(() => {
    const selectedLocation = route.params?.selectedLocation;

    if (!selectedLocation) {
      return;
    }

    setDeliveryLocation(selectedLocation);
    if (selectedLocation.address) {
      setDeliveryNote(selectedLocation.address);
    }
    setErrors((current) => ({ ...current, deliveryLocation: undefined, deliveryAddress: undefined }));
    navigation.setParams({ selectedLocation: undefined });
  }, [navigation, route.params?.selectedLocation]);

  useEffect(() => {
    let isMounted = true;

    async function loadDeliveryFee() {
      if (!isDelivery || !restaurantId || items.length === 0 || !hasValidLocation) {
        if (isMounted) {
          setDeliveryFeeBreakdown(null);
          setQuoteError("");
        }
        return;
      }

      try {
        setLoadingEstimate(true);
        setQuoteError("");
        const response = await fetchDeliveryFeeEstimate({
          restaurantId,
          deliveryLatitude: deliveryLocation.latitude,
          deliveryLongitude: deliveryLocation.longitude,
        });

        if (isMounted) {
          setDeliveryFeeBreakdown(response);
        }
      } catch (error) {
        if (isMounted) {
          setDeliveryFeeBreakdown(null);
          setQuoteError(error.message || "Unable to calculate delivery distance right now.");
        }
      } finally {
        if (isMounted) {
          setLoadingEstimate(false);
        }
      }
    }

    loadDeliveryFee();

    return () => {
      isMounted = false;
    };
  }, [deliveryLocation?.latitude, deliveryLocation?.longitude, hasValidLocation, isDelivery, items.length, restaurantId]);

  async function handlePlaceOrder() {
    if (items.length === 0) {
      Alert.alert("Cart Empty", "Please add items before checkout.");
      return;
    }

    const nextErrors = {};

    if (!validateRequired(activeNote)) {
      nextErrors.deliveryNote = isDelivery
        ? "Please enter your hostel or room delivery note."
        : "Please enter your pickup note.";
    }

    if (isDelivery && !hasValidLocation) {
      nextErrors.deliveryLocation = "Please select your delivery location on the map.";
    }

    if (isDelivery && !deliveryFeeBreakdown) {
      nextErrors.deliveryFee = quoteError || "Delivery fee is still being calculated.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      const order = await createOrder({
        studentId: user?.id,
        restaurantId: items[0]?.restaurantId,
        orderType,
        customerName: user?.name,
        customerPhone: user?.phone || "+1 416-555-0200",
        deliveryAddress: isDelivery ? deliveryLocation.address || deliveryNote : "Take Away",
        deliveryNote: activeNote,
        deliveryLatitude: isDelivery ? deliveryLocation.latitude : undefined,
        deliveryLongitude: isDelivery ? deliveryLocation.longitude : undefined,
        items,
        total: total + Number(isDelivery ? deliveryFeeBreakdown?.totalFee || 0 : 0),
        paymentMethod: "Cash on Delivery",
        eta: "25 mins",
        deliveryPartnerName: "Assigned soon",
      });
      clearCart();
      navigation.replace("OrderTracking", { order });
    } catch (errorMessage) {
      Alert.alert("Checkout Failed", errorMessage.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.card}>
        <Text style={styles.heading}>Checkout Summary</Text>
        <Text style={styles.sectionLabel}>Order option</Text>
        <View style={styles.optionRow}>
          <Pressable
            style={[styles.optionCard, orderType === "takeaway" && styles.optionCardActive]}
            onPress={() => setOrderType("takeaway")}
          >
            <Ionicons
              name="bag-handle-outline"
              size={18}
              color={orderType === "takeaway" ? "#FFFFFF" : appTheme.colors.text}
            />
            <Text style={[styles.optionTitle, orderType === "takeaway" && styles.optionTitleActive]}>
              Take Away
            </Text>
          </Pressable>
          <Pressable
            style={[styles.optionCard, orderType === "delivery" && styles.optionCardActive]}
            onPress={() => setOrderType("delivery")}
          >
            <Ionicons
              name="bicycle-outline"
              size={18}
              color={orderType === "delivery" ? "#FFFFFF" : appTheme.colors.text}
            />
            <Text style={[styles.optionTitle, orderType === "delivery" && styles.optionTitleActive]}>
              Delivery
            </Text>
          </Pressable>
        </View>
        <Text style={styles.meta}>Payment method: Cash on Delivery</Text>
        {isDelivery ? (
          <>
            <View style={styles.locationBlock}>
              <Text style={styles.locationLabel}>Delivery location</Text>
              <Pressable
                style={styles.locationPicker}
                onPress={() =>
                  navigation.navigate("LocationPicker", {
                    sourceRoute: "Checkout",
                    title: "Select Delivery Location",
                    initialLatitude: deliveryLocation?.latitude,
                    initialLongitude: deliveryLocation?.longitude,
                    initialAddress: deliveryLocation?.address || deliveryNote,
                  })
                }
              >
                <View style={styles.locationIcon}>
                  <Ionicons name="location" size={18} color="#FFFFFF" />
                </View>
                <View style={styles.locationTextGroup}>
                  <Text style={styles.locationTitle}>
                    {hasValidLocation ? "Delivery location selected" : "Select Delivery Location"}
                  </Text>
                  <Text style={styles.locationText}>
                    {deliveryLocation?.address ||
                      (hasValidLocation
                        ? `${deliveryLocation.latitude.toFixed(6)}, ${deliveryLocation.longitude.toFixed(6)}`
                        : "Pick your hostel or delivery point on the map.")}
                  </Text>
                </View>
              </Pressable>
              {errors.deliveryLocation ? <Text style={styles.error}>{errors.deliveryLocation}</Text> : null}
            </View>
            <Text style={styles.meta}>Estimated distance: {deliveryFeeBreakdown ? `${distanceKm.toFixed(1)} km` : "--"}</Text>
          </>
        ) : (
          <Text style={styles.meta}>Pickup from the restaurant counter. No delivery fee will be charged.</Text>
        )}
        <View style={styles.row}>
          <Text style={styles.meta}>Subtotal</Text>
          <Text style={styles.meta}>{formatCurrency(total)}</Text>
        </View>
        {isDelivery ? (
          <View style={styles.row}>
            <Text style={styles.meta}>Delivery fee</Text>
            <Text style={styles.meta}>
              {loadingEstimate ? "Calculating..." : formatCurrency(deliveryFee)}
            </Text>
          </View>
        ) : null}
        {isDelivery && deliveryFeeBreakdown ? (
          <View style={styles.breakdownCard}>
            <View style={styles.row}>
              <Text style={styles.breakdownLabel}>Base fee</Text>
              <Text style={styles.breakdownValue}>
                {formatCurrency(deliveryFeeBreakdown.baseFee)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.breakdownLabel}>
                Distance fee ({deliveryFeeBreakdown.distanceKm} km x Rs. {deliveryFeeBreakdown.perKmRate})
              </Text>
              <Text style={styles.breakdownValue}>
                {formatCurrency(deliveryFeeBreakdown.distanceFee)}
              </Text>
            </View>
            {deliveryFeeBreakdown.peakFee ? (
              <View style={styles.row}>
                <Text style={styles.breakdownLabel}>Peak-time fee</Text>
                <Text style={styles.breakdownValue}>
                  {formatCurrency(deliveryFeeBreakdown.peakFee)}
                </Text>
              </View>
            ) : null}
            {deliveryFeeBreakdown.longDistanceFee ? (
              <View style={styles.row}>
                <Text style={styles.breakdownLabel}>Long-distance fee</Text>
                <Text style={styles.breakdownValue}>
                  {formatCurrency(deliveryFeeBreakdown.longDistanceFee)}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
        {errors.deliveryFee ? <Text style={styles.error}>{errors.deliveryFee}</Text> : null}
        <Text style={styles.total}>Total payable: {formatCurrency(totalAmount)}</Text>
      </View>

      <View style={styles.card}>
        <AppInput
          label={isDelivery ? "Delivery Note" : "Pickup Note"}
          value={activeNote}
          onChangeText={isDelivery ? setDeliveryNote : setPickupNote}
          placeholder={isDelivery ? "Hostel block, floor, room number" : "Pickup note or contact detail"}
          error={errors.deliveryNote}
          multiline
        />
      </View>

      <AppButton title="Place Order" onPress={handlePlaceOrder} loading={loading} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.sm,
    ...appTheme.shadow,
  },
  heading: {
    fontSize: 20,
    fontWeight: "800",
    color: appTheme.colors.text,
  },
  sectionLabel: {
    color: appTheme.colors.text,
    fontWeight: "700",
  },
  optionRow: {
    flexDirection: "row",
    gap: appTheme.spacing.sm,
  },
  optionCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: appTheme.spacing.xs,
    borderRadius: appTheme.radius.md,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surface,
    paddingVertical: 14,
  },
  optionCardActive: {
    backgroundColor: appTheme.colors.primary,
    borderColor: appTheme.colors.primary,
  },
  optionTitle: {
    color: appTheme.colors.text,
    fontWeight: "700",
  },
  optionTitleActive: {
    color: "#FFFFFF",
  },
  meta: {
    color: appTheme.colors.textMuted,
  },
  locationBlock: {
    gap: appTheme.spacing.xs,
  },
  locationLabel: {
    color: appTheme.colors.text,
    fontWeight: "600",
  },
  locationPicker: {
    borderRadius: appTheme.radius.md,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surface,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: appTheme.spacing.sm,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: appTheme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  locationTextGroup: {
    flex: 1,
    gap: 2,
  },
  locationTitle: {
    color: appTheme.colors.text,
    fontWeight: "700",
  },
  locationText: {
    color: appTheme.colors.textMuted,
    lineHeight: 19,
  },
  breakdownCard: {
    marginTop: appTheme.spacing.xs,
    paddingTop: appTheme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: appTheme.colors.border,
    gap: appTheme.spacing.xs,
  },
  breakdownLabel: {
    color: appTheme.colors.textMuted,
    flex: 1,
  },
  breakdownValue: {
    color: appTheme.colors.text,
    fontWeight: "700",
  },
  total: {
    color: appTheme.colors.primary,
    fontSize: 18,
    fontWeight: "800",
  },
  error: {
    color: appTheme.colors.danger,
    fontSize: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: appTheme.spacing.md,
  },
});
