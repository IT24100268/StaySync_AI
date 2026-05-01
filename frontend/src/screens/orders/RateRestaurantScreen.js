import React, { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ScreenContainer from "../../components/common/ScreenContainer";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import { fetchOrderTracking } from "../../services/orderService";
import { submitRestaurantReview } from "../../services/reviewService";
import { appTheme } from "../../theme";

function RatingStars({ rating, onChange }) {
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Pressable key={value} onPress={() => onChange(value)} style={styles.starButton}>
          <Ionicons
            name={rating >= value ? "star" : "star-outline"}
            size={32}
            color="#F4B740"
          />
        </Pressable>
      ))}
    </View>
  );
}

export default function RateRestaurantScreen({ route, navigation }) {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [loading, setLoading] = useState(false);
  const { orderId, restaurantName } = route.params || {};

  const helperText = useMemo(() => {
    if (rating === 0) {
      return "Tap a star to rate the restaurant.";
    }

    return `${rating} out of 5 selected`;
  }, [rating]);

  async function handleSubmit() {
    if (!rating) {
      Alert.alert("Rating Required", "Please select a star rating before submitting.");
      return;
    }

    setLoading(true);
    try {
      await submitRestaurantReview({
        orderId,
        rating,
        reviewText,
      });
      navigation.replace("OrderTracking", {
        orderId,
        refreshAt: Date.now(),
        successMessage: "Thank you for rating this restaurant.",
      });
    } catch (error) {
      if (error?.statusCode === 409 || error?.message?.toLowerCase().includes("already reviewed")) {
        navigation.replace("OrderTracking", {
          orderId,
          refreshAt: Date.now(),
          successMessage: "You have already submitted a review for this order.",
        });
      } else {
        Alert.alert("Review Failed", error.message || "Unable to submit your review right now.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.card}>
        <Text style={styles.title}>Rate Restaurant</Text>
        <Text style={styles.subtitle}>
          Share your feedback for {restaurantName || "this restaurant"} after your delivered order.
        </Text>

        <RatingStars rating={rating} onChange={setRating} />
        <Text style={styles.helperText}>{helperText}</Text>

        <AppInput
          label="Review"
          multiline
          value={reviewText}
          onChangeText={setReviewText}
          placeholder="Optional: tell others about the food and delivery experience"
        />
      </View>

      <AppButton title="Submit Review" onPress={handleSubmit} loading={loading} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.md,
    ...appTheme.shadow,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: appTheme.colors.text,
  },
  subtitle: {
    color: appTheme.colors.textMuted,
    lineHeight: 20,
  },
  starsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  starButton: {
    paddingVertical: appTheme.spacing.xs,
    paddingHorizontal: 2,
  },
  helperText: {
    color: appTheme.colors.textMuted,
    fontSize: 13,
  },
});
