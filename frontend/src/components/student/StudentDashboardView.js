import React, { useEffect, useState } from "react";
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import ScreenContainer from "../common/ScreenContainer";
import SectionHeader from "../common/SectionHeader";
import { useRoleAuth } from "../../context/RoleAuthContext";
import { restaurants as seedRestaurants, orders } from "../../data/dummyData";
import { connectSocket, disconnectSocket } from "../../services/socketService";
import { fetchStudentOrders, markOrderNotificationSeen } from "../../services/orderService";
import { fetchRooms } from "../../services/roomService";
import { fetchRestaurants } from "../../services/restaurantService";
import { appTheme } from "../../theme";
import AppButton from "../common/AppButton";
import DashboardQuickActionCard from "./DashboardQuickActionCard";
import RecommendedRoomCard from "./RecommendedRoomCard";
import NearbyRestaurantCard from "./NearbyRestaurantCard";
import RecentActivityItem from "./RecentActivityItem";
import OfferBanner from "./OfferBanner";
import ReportIssueFab from "../reports/ReportIssueFab";

const quickActions = [
  {
    id: "find-rooms",
    title: "Booking Room",
    subtitle: "Browse available rooms near campus",
    icon: "bed-outline",
    tint: "#DFF4FA",
    action: "rooms",
  },
  {
    id: "order-food",
    title: "Order Food",
    subtitle: "See nearby restaurants and menus",
    icon: "restaurant-outline",
    tint: "#E8F7EE",
    action: "food",
  },
  {
    id: "track-orders",
    title: "Track Orders",
    subtitle: "Follow delivery progress in real time",
    icon: "navigate-outline",
    tint: "#FFF1DD",
    action: "track",
  },
  {
    id: "saved-rooms",
    title: "Saved Rooms",
    subtitle: "Return to your shortlist quickly",
    icon: "heart-outline",
    tint: "#FDE7EC",
    action: "saved",
  },
];

const STUDENT_NOTIFICATION_REFRESH_MS = 8000;

function formatRelativeTime(value) {
  if (!value) {
    return "Now";
  }

  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return "Now";
  }

  const diffMs = Date.now() - timestamp;

  if (diffMs <= 0) {
    return "Now";
  }

  const minutes = Math.floor(diffMs / (1000 * 60));

  if (minutes < 1) {
    return "Now";
  }

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function StudentDashboardView({ navigation }) {
  const { user, token, logout } = useRoleAuth();
  const firstName = user?.name?.split(" ")?.[0] || "Student";
  const [availableRooms, setAvailableRooms] = useState([]);
  const [restaurants, setRestaurants] = useState(seedRestaurants);
  const [showNotifications, setShowNotifications] = useState(false);
  const [orderNotifications, setOrderNotifications] = useState([]);

  useEffect(() => {
    loadRooms();
    loadRestaurants();
    if (token) {
      loadRejectedOrderNotifications();
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadRooms();

      if (token) {
        loadRejectedOrderNotifications();
      }
    }, [token])
  );

  useEffect(() => {
    if (token) {
      loadRejectedOrderNotifications();
    } else {
      setOrderNotifications([]);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      disconnectSocket();
      return undefined;
    }

    const socket = connectSocket(token);

    if (!socket) {
      return undefined;
    }

    const upsertNotification = (incomingNotification) => {
      setOrderNotifications((current) => {
        const existingIndex = current.findIndex((item) => item.id === incomingNotification.id);

        if (existingIndex >= 0) {
          const next = [...current];
          next[existingIndex] = incomingNotification;
          return next;
        }

        return [incomingNotification, ...current];
      });
    };

    const handleRejectedOrder = ({ tracking }) => {
      if (!tracking?.order) {
        return;
      }

      upsertNotification({
        id: tracking.order._id || tracking.order.id,
        type: "rejected",
        restaurantName: tracking.order.restaurant?.name || "Restaurant",
        createdAt: tracking.order.updatedAt || tracking.order.createdAt,
        total: tracking.order.totalAmount || 0,
        rejectionReason: tracking.order.rejectionReason || "",
      });
    };

    const handleAcceptedOrder = ({ tracking }) => {
      if (!tracking?.order) {
        return;
      }

      upsertNotification({
        id: tracking.order._id || tracking.order.id,
        type: "accepted",
        restaurantName: tracking.order.restaurant?.name || "Restaurant",
        createdAt: tracking.order.updatedAt || tracking.order.createdAt,
        total: tracking.order.totalAmount || 0,
        rejectionReason: "",
      });
    };

    socket.on("student:order-rejected", handleRejectedOrder);
    socket.on("student:order-accepted", handleAcceptedOrder);

    return () => {
      socket.off("student:order-rejected", handleRejectedOrder);
      socket.off("student:order-accepted", handleAcceptedOrder);
    };
  }, [token]);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      loadRejectedOrderNotifications();
    }, STUDENT_NOTIFICATION_REFRESH_MS);

    return () => clearInterval(intervalId);
  }, [token]);

  async function loadRooms() {
    try {
      const response = await fetchRooms();
      setAvailableRooms(response);
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  }

  async function loadRestaurants() {
    try {
      const response = await fetchRestaurants();
      setRestaurants(response);
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  }

  async function loadRejectedOrderNotifications() {
    try {
      const studentOrders = await fetchStudentOrders();
      const nextNotifications = studentOrders
        .filter(
          (order) =>
            (order.status === "Rejected" && order.rejectionReason && !order.rejectionSeenByStudent) ||
            (order.status === "Accepted" && !order.acceptanceSeenByStudent)
        )
        .map((order) => ({
          id: order.id,
          type: order.status === "Accepted" ? "accepted" : "rejected",
          restaurantName: order.restaurantName,
          createdAt: order.createdAt,
          total: order.total,
          rejectionReason: order.rejectionReason,
        }));

      setOrderNotifications((current) => {
        const currentIds = new Set(current.map((item) => item.id));
        const mergedNotifications = [...current];

        nextNotifications.forEach((item) => {
          const existingIndex = mergedNotifications.findIndex((entry) => entry.id === item.id);

          if (existingIndex >= 0) {
            mergedNotifications[existingIndex] = item;
            return;
          }

          if (!currentIds.has(item.id)) {
            mergedNotifications.unshift(item);
          }
        });

        return mergedNotifications.filter((item) =>
          nextNotifications.some((nextItem) => nextItem.id === item.id)
        );
      });
    } catch (error) {
      void error;
    }
  }

  async function dismissRejectionNotification(orderId) {
    try {
      await markOrderNotificationSeen(orderId);
      setOrderNotifications((current) => current.filter((item) => item.id !== orderId));
    } catch (error) {
      Alert.alert("Unable to dismiss", error.message || "Please try again.");
    }
  }

  function handleQuickAction(action) {
    if (action === "rooms") {
      navigation.getParent()?.navigate("RoomsTab");
      return;
    }

    if (action === "food") {
      navigation.navigate("Restaurants");
      return;
    }

    if (action === "track") {
      navigation.navigate("OrderTracking");
      return;
    }

    if (action === "saved") {
      navigation.navigate("Favourites");
    }
  }

  function handleReportFabSelect(optionKey) {
    if (optionKey === "room") {
      navigation.navigate("ComplaintForm", {
        mode: "room",
        title: "Report a room issue",
        subtitle: "Flag room concerns, fake listings, or pricing problems.",
        initialType: "Room Issue",
      });
      return;
    }

    if (optionKey === "food") {
      navigation.navigate("ComplaintForm", {
        mode: "food",
        title: "Report a food issue",
        subtitle: "Tell us about order or delivery problems.",
        initialType: "Food / Delivery Issue",
      });
      return;
    }

    navigation.navigate("ComplaintForm", {
      mode: "other",
      title: "Report another issue",
      subtitle: "Send any other concern to the StaySync support team.",
      initialType: "Other",
    });
  }

  const latestRoom = [...availableRooms]
    .sort((firstRoom, secondRoom) => {
      const firstTimestamp = new Date(firstRoom.createdAt || firstRoom.updatedAt || 0).getTime();
      const secondTimestamp = new Date(secondRoom.createdAt || secondRoom.updatedAt || 0).getTime();
      return secondTimestamp - firstTimestamp;
    })[0];

  const recentActivity = [
    {
      id: "activity-1",
      title: "Room owner added a new listing",
      subtitle: "New room listings are available for booking near your stay.",
      time: formatRelativeTime(latestRoom?.createdAt || latestRoom?.updatedAt),
      icon: "home-outline",
      tint: "#DFF4FA",
    },
    {
      id: "activity-2",
      title: "Order on the way",
      subtitle: `${orders[0]?.deliveryPartner || "Your rider"} is heading to your hostel with your meal.`,
      time: "18m",
      icon: "bicycle-outline",
      tint: "#E8F7EE",
    },
  ];

  return (
    <View style={styles.screen}>
      <ScreenContainer style={styles.screen} contentContainerStyle={styles.content}>
        <LinearGradient colors={["#08354B", "#0B5D7A", "#13829E"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerCard}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerIntro}>
              <View style={styles.headerBadge}>
                <Ionicons name="sparkles-outline" size={14} color="#FFFFFF" />
                <Text style={styles.headerBadgeText}>Student dashboard</Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <Pressable style={styles.notificationButton} onPress={() => setShowNotifications(true)}>
                <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
                {orderNotifications.length > 0 ? (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {orderNotifications.length > 9 ? "9+" : orderNotifications.length}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
              <Pressable style={styles.logoutButton} onPress={logout}>
                <Text style={styles.logoutText}>Logout</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.headerCopy}>
            <Text style={styles.headerEyebrow}>Everything in one place</Text>
            <View style={styles.headerGreetingRow}>
              <Text style={styles.headerTitle}>Welcome back, </Text>
              <Text style={styles.headerNameAccent}>{firstName}</Text>
            </View>
            <Text style={styles.headerSubtitle}>
              Manage your stay, meals, and bookings from one calm, mobile-first dashboard.
            </Text>
          </View>

          <View style={styles.headerStats}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{availableRooms.length}</Text>
              <Text style={styles.statLabel}>Available rooms</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{restaurants.length}</Text>
              <Text style={styles.statLabel}>Nearby restaurants</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.sectionBlock}>
          <SectionHeader
            title="Quick actions"
            subtitle="Jump into the tasks students use most often"
          />
          <FlatList
            horizontal
            data={quickActions}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <DashboardQuickActionCard
                icon={item.icon}
                title={item.title}
                subtitle={item.subtitle}
                accentColor={item.tint}
                onPress={() => handleQuickAction(item.action)}
              />
            )}
          />
        </View>

        <View style={styles.sectionBlock}>
          <SectionHeader
            title="Available rooms"
            subtitle="Browse rooms that are currently open for booking"
            rightElement={
              <Pressable onPress={() => navigation.getParent()?.navigate("RoomsTab")}>
                <Text style={styles.linkText}>See all</Text>
              </Pressable>
            }
          />
          <FlatList
            horizontal
            data={availableRooms}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <RecommendedRoomCard
                room={item}
                onPress={() => navigation.navigate("RoomDetail", { roomId: item.id })}
              />
            )}
          />
        </View>

        <OfferBanner onPress={() => navigation.navigate("Restaurants")} />

        <View style={styles.sectionBlock}>
          <SectionHeader
            title="Nearby restaurants"
            subtitle="Reliable options around campus and your hostel"
            rightElement={
              <Pressable onPress={() => navigation.navigate("Restaurants")}>
                <Text style={styles.linkText}>Browse</Text>
              </Pressable>
            }
          />
          <FlatList
            horizontal
            data={restaurants}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <NearbyRestaurantCard
                restaurant={item}
                onPress={() =>
                  navigation.navigate("FoodMenu", {
                    restaurantId: item.id,
                    restaurantName: item.name,
                  })
                }
              />
            )}
          />
        </View>

        <View style={styles.activityCard}>
          <SectionHeader
            title="Recent activity"
            subtitle="Your latest room, food, and delivery updates"
          />
          <View style={styles.activityList}>
            {recentActivity.map((item, index) => (
              <View key={item.id}>
                <RecentActivityItem item={item} />
                {index < recentActivity.length - 1 ? <View style={styles.divider} /> : null}
              </View>
            ))}
          </View>
        </View>

        <Modal visible={showNotifications} transparent animationType="fade" onRequestClose={() => setShowNotifications(false)}>
          <View style={styles.notificationOverlay}>
            <Pressable style={styles.overlayDismiss} onPress={() => setShowNotifications(false)} />
            <View style={styles.notificationModal}>
              <Text style={styles.notificationTitle}>Order Notifications</Text>
              <Text style={styles.notificationSubtitle}>
                Accepted and rejected updates for your recent food orders appear here.
              </Text>

              {orderNotifications.length > 0 ? (
                orderNotifications.map((item) => (
                  <View key={item.id} style={styles.notificationCard}>
                    <View style={styles.notificationCardHeader}>
                      <Text style={styles.notificationRestaurant}>{item.restaurantName}</Text>
                      <Text style={styles.notificationTime}>{new Date(item.createdAt).toLocaleString()}</Text>
                    </View>
                    <Text style={styles.notificationReason}>
                      {item.type === "accepted"
                        ? "Your food order was accepted successfully."
                        : item.rejectionReason}
                    </Text>
                    <Text style={styles.notificationMeta}>Order total: Rs. {item.total}</Text>
                    <View style={styles.notificationCardActions}>
                      <AppButton title="Track Order" variant="secondary" onPress={() => {
                        setShowNotifications(false);
                        navigation.navigate("OrderTracking", { orderId: item.id });
                      }} />
                      <AppButton title="Dismiss" onPress={() => dismissRejectionNotification(item.id)} />
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyNotificationText}>No order notifications right now.</Text>
              )}

              <AppButton title="Close" variant="secondary" onPress={() => setShowNotifications(false)} />
            </View>
          </View>
        </Modal>
      </ScreenContainer>

      <ReportIssueFab onSelect={handleReportFabSelect} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingBottom: 110,
  },
  headerCard: {
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.lg,
    overflow: "hidden",
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: appTheme.spacing.md,
  },
  headerIntro: {
    flex: 1,
    justifyContent: "flex-start",
    paddingTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: appTheme.spacing.sm,
    flexShrink: 0,
    padding: 4,
    borderRadius: appTheme.radius.pill,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: appTheme.radius.pill,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  headerBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  logoutButton: {
    borderRadius: appTheme.radius.pill,
    minHeight: 42,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  notificationButton: {
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    position: "relative",
  },
  notificationBadge: {
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
  notificationBadgeText: {
    color: appTheme.colors.primary,
    fontSize: 11,
    fontWeight: "800",
  },
  headerCopy: {
    gap: appTheme.spacing.sm,
    maxWidth: "92%",
  },
  headerEyebrow: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  headerGreetingRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 36,
  },
  headerNameAccent: {
    color: "#D8F7FF",
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 36,
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 420,
  },
  headerStats: {
    flexDirection: "row",
    gap: appTheme.spacing.sm,
  },
  statCard: {
    flex: 1,
    borderRadius: appTheme.radius.md,
    padding: appTheme.spacing.md,
    backgroundColor: "rgba(255,255,255,0.14)",
    gap: 4,
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  statLabel: {
    color: "rgba(255,255,255,0.86)",
    fontSize: 12,
    lineHeight: 16,
  },
  sectionBlock: {
    gap: appTheme.spacing.md,
  },
  horizontalList: {
    paddingRight: appTheme.spacing.sm,
    gap: appTheme.spacing.md,
  },
  linkText: {
    color: appTheme.colors.primary,
    fontSize: 13,
    fontWeight: "800",
  },
  activityCard: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.md,
    borderWidth: 1,
    borderColor: "#E6EEF4",
    ...appTheme.shadow,
  },
  activityList: {
    gap: appTheme.spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: "#EEF3F7",
  },
  notificationOverlay: {
    flex: 1,
    backgroundColor: "rgba(16,24,38,0.45)",
    justifyContent: "center",
    padding: appTheme.spacing.lg,
  },
  overlayDismiss: {
    ...StyleSheet.absoluteFillObject,
  },
  notificationModal: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.md,
    maxHeight: "80%",
  },
  notificationTitle: {
    color: appTheme.colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  notificationSubtitle: {
    color: appTheme.colors.textMuted,
    lineHeight: 20,
  },
  notificationCard: {
    borderWidth: 1,
    borderColor: "#E6EEF4",
    borderRadius: appTheme.radius.md,
    padding: appTheme.spacing.md,
    gap: appTheme.spacing.sm,
    backgroundColor: "#FBFDFF",
  },
  notificationCardHeader: {
    gap: 4,
  },
  notificationRestaurant: {
    color: appTheme.colors.text,
    fontWeight: "800",
    fontSize: 15,
  },
  notificationTime: {
    color: appTheme.colors.textMuted,
    fontSize: 12,
  },
  notificationReason: {
    color: appTheme.colors.text,
    lineHeight: 20,
  },
  notificationMeta: {
    color: appTheme.colors.textMuted,
    fontSize: 12,
  },
  notificationCardActions: {
    gap: appTheme.spacing.sm,
  },
  emptyNotificationText: {
    color: appTheme.colors.textMuted,
  },
});
