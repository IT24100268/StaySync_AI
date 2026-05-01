import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import ScreenContainer from "../../../../components/common/ScreenContainer";
import SectionHeader from "../../../../components/common/SectionHeader";
import { appTheme } from "../../../../theme";
import { useRoleAuth } from "../../../../context/RoleAuthContext";
import { useRestaurantAuth } from "../../context/RestaurantAuthContext";
import { useMenu } from "../../context/MenuContext";
import { useOrders } from "../../context/OrderContext";
import DashboardStatCard from "../../components/cards/DashboardStatCard";
import FoodItemCard from "../../components/cards/FoodItemCard";
import { fetchRestaurantProfile } from "../../services/restaurantProfileService";
import { fetchRestaurantReviews } from "../../../../services/restaurantService";

export default function RestaurantHomeScreen({ navigation }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [ratingSummary, setRatingSummary] = useState({ averageRating: 0, totalRatings: 0 });
  const [recentReviews, setRecentReviews] = useState([]);
  const { restaurant } = useRestaurantAuth();
  const { logout } = useRoleAuth();
  const { menuItems, analytics: menuAnalytics, toggleAvailability, removeFoodItem, loadMenu } = useMenu();
  const { analytics: orderAnalytics, latestNewOrderAlert, dismissNewOrderAlert } = useOrders();

  useFocusEffect(
    React.useCallback(() => {
      loadMenu();
    }, [loadMenu])
  );

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      async function loadReviewSummary() {
        try {
          const profile = await fetchRestaurantProfile();
          const reviewResponse = await fetchRestaurantReviews(profile.id, 5);

          if (!isActive) {
            return;
          }

          setRatingSummary({
            averageRating: profile.averageRating || 0,
            totalRatings: profile.totalRatings || 0,
          });
          setRecentReviews(reviewResponse.reviews);
        } catch (error) {
          if (!isActive) {
            return;
          }

          setRatingSummary({ averageRating: 0, totalRatings: 0 });
          setRecentReviews([]);
        }
      }

      loadReviewSummary();

      return () => {
        isActive = false;
      };
    }, [])
  );

  function confirmDelete(foodId) {
    Alert.alert("Delete Food Item", "Are you sure you want to remove this food item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await removeFoodItem(foodId);
        },
      },
    ]);
  }

  return (
    <ScreenContainer>
      <View style={styles.banner}>
        <View style={styles.bannerHeader}>
          <View style={styles.bannerCopy}>
            <Text style={styles.eyebrow}>Restaurant console</Text>
            <Text style={styles.title}>Welcome, {restaurant?.name}</Text>
            <Text style={styles.subtitle}>
              Control menu availability, process orders, and track sales performance.
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              style={styles.bellButton}
              onPress={() => setShowNotifications((current) => !current)}
            >
              <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
              {orderAnalytics.unreadNewOrderCount > 0 ? (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>
                    {orderAnalytics.unreadNewOrderCount > 9 ? "9+" : orderAnalytics.unreadNewOrderCount}
                  </Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable style={styles.logoutButton} onPress={logout}>
              <Text style={styles.logoutText}>Logout</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.grid}>
        <DashboardStatCard label="Total Menu Items" value={menuAnalytics.totalMenuItems} icon="restaurant-outline" />
        <DashboardStatCard label="Available Items" value={menuAnalytics.availableItems} icon="checkmark-circle-outline" accentColor={appTheme.colors.success} />
        <DashboardStatCard label="Total Orders" value={orderAnalytics.totalOrders} icon="receipt-outline" accentColor={appTheme.colors.info} />
        <DashboardStatCard
          label="Average Rating"
          value={ratingSummary.totalRatings > 0 ? ratingSummary.averageRating.toFixed(1) : "0.0"}
          icon="star"
          accentColor="#F4B740"
        />
        <DashboardStatCard label="Total Ratings" value={ratingSummary.totalRatings} icon="chatbubble-ellipses-outline" accentColor="#8A6514" />
        <DashboardStatCard label="Pending Orders" value={orderAnalytics.pendingOrders} icon="time-outline" accentColor={appTheme.colors.warning} />
        <DashboardStatCard label="New Order Alerts" value={orderAnalytics.unreadNewOrderCount} icon="notifications-outline" accentColor="#B9481B" />
      </View>

      <Modal
        visible={showNotifications}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNotifications(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowNotifications(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            {latestNewOrderAlert ? (
              <>
                <View style={styles.notificationHeader}>
                  <View style={styles.notificationCopy}>
                    <Text style={styles.notificationEyebrow}>Current order notification</Text>
                    <Text style={styles.notificationTitle}>
                      {latestNewOrderAlert.customerName} placed an order
                    </Text>
                    <Text style={styles.notificationText}>
                      {latestNewOrderAlert.items.length} item{latestNewOrderAlert.items.length === 1 ? "" : "s"} • Rs. {latestNewOrderAlert.total}
                    </Text>
                    <Text style={styles.notificationText}>{latestNewOrderAlert.deliveryAddress}</Text>
                  </View>
                </View>
                <View style={styles.notificationActions}>
                  <Pressable
                    style={styles.secondaryButton}
                    onPress={() => {
                      dismissNewOrderAlert(latestNewOrderAlert.id);
                      setShowNotifications(false);
                    }}
                  >
                    <Text style={styles.secondaryButtonText}>Dismiss</Text>
                  </Pressable>
                  <Pressable
                    style={styles.primaryButton}
                    onPress={() => setShowNotifications(false)}
                  >
                    <Text style={styles.primaryButtonText}>Close</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.notificationEyebrow}>Order notifications</Text>
                <Text style={styles.notificationTitle}>No current notification</Text>
                <Text style={styles.notificationText}>
                  New student food orders will appear here instantly.
                </Text>
                <View style={styles.notificationActions}>
                  <Pressable
                    style={styles.primaryButton}
                    onPress={() => setShowNotifications(false)}
                  >
                    <Text style={styles.primaryButtonText}>Close</Text>
                  </Pressable>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <SectionHeader title="Featured menu items" subtitle="Quick access to your current active menu" />
      {menuItems.slice(0, 2).map((item) => (
        <FoodItemCard
          key={item.id}
          item={item}
          onPress={() => navigation.navigate("FoodItemDetails", { foodId: item.id })}
          onEdit={() => navigation.getParent()?.navigate("MenuTab", { screen: "EditFoodItem", params: { foodId: item.id } })}
          onToggle={() => toggleAvailability(item.id)}
          onDelete={() => confirmDelete(item.id)}
        />
      ))}

      <View style={styles.reviewsCard}>
        <SectionHeader
          title="Recent Reviews"
          subtitle={
            ratingSummary.totalRatings > 0
              ? `${ratingSummary.averageRating.toFixed(1)} average from ${ratingSummary.totalRatings} ratings`
              : "Reviews from delivered student orders will appear here."
          }
        />
        {recentReviews.length > 0 ? (
          recentReviews.map((review) => (
            <View key={review.id} style={styles.reviewRow}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewAuthor}>{review.studentName}</Text>
                <View style={styles.reviewBadge}>
                  <Ionicons name="star" size={12} color="#F4B740" />
                  <Text style={styles.reviewBadgeText}>{review.rating}</Text>
                </View>
              </View>
              <Text style={styles.reviewDate}>{new Date(review.createdAt).toLocaleDateString()}</Text>
              <Text style={styles.reviewBody}>
                {review.reviewText || "Student submitted a rating without a written review."}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyReviewText}>No reviews yet.</Text>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#B9481B",
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.xl,
  },
  bannerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: appTheme.spacing.sm,
  },
  headerActions: {
    alignItems: "flex-end",
    gap: appTheme.spacing.sm,
  },
  bannerCopy: {
    flex: 1,
    gap: appTheme.spacing.sm,
  },
  eyebrow: {
    color: "rgba(255,255,255,0.76)",
    textTransform: "uppercase",
    fontSize: 12,
    letterSpacing: 1,
  },
  title: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 26,
  },
  subtitle: {
    color: "rgba(255,255,255,0.92)",
    lineHeight: 21,
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  bellBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  bellBadgeText: {
    color: "#B9481B",
    fontSize: 11,
    fontWeight: "800",
  },
  logoutButton: {
    alignSelf: "flex-start",
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.xs,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },
  logoutText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: appTheme.spacing.md,
  },
  reviewsCard: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.md,
    ...appTheme.shadow,
  },
  reviewRow: {
    gap: 6,
    paddingBottom: appTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF3F7",
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: appTheme.spacing.sm,
  },
  reviewAuthor: {
    color: appTheme.colors.text,
    fontWeight: "800",
  },
  reviewBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#FFF4D8",
  },
  reviewBadgeText: {
    color: "#8A6514",
    fontWeight: "800",
    fontSize: 12,
  },
  reviewDate: {
    color: appTheme.colors.textMuted,
    fontSize: 12,
  },
  reviewBody: {
    color: appTheme.colors.textMuted,
    lineHeight: 20,
  },
  emptyReviewText: {
    color: appTheme.colors.textMuted,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(16, 52, 71, 0.28)",
    justifyContent: "center",
    padding: appTheme.spacing.lg,
  },
  modalCard: {
    backgroundColor: "#FFF3EC",
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(185,72,27,0.18)",
    gap: appTheme.spacing.sm,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: appTheme.spacing.md,
  },
  notificationCopy: {
    flex: 1,
    gap: 4,
  },
  notificationEyebrow: {
    color: "#B9481B",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontSize: 11,
    fontWeight: "700",
  },
  notificationTitle: {
    color: appTheme.colors.text,
    fontWeight: "800",
    fontSize: 18,
  },
  notificationText: {
    color: appTheme.colors.textMuted,
    lineHeight: 20,
  },
  notificationActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: appTheme.spacing.sm,
    marginTop: appTheme.spacing.sm,
  },
  secondaryButton: {
    alignSelf: "flex-start",
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.xs,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
  },
  secondaryButtonText: {
    color: "#B9481B",
    fontWeight: "700",
  },
  primaryButton: {
    alignSelf: "flex-start",
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.xs,
    borderRadius: 999,
    backgroundColor: "#B9481B",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
