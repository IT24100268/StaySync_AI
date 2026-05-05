import React from "react";
import { StyleSheet, Text, View } from "react-native";
import ScreenContainer from "../../../../components/common/ScreenContainer";
import SectionHeader from "../../../../components/common/SectionHeader";
import { appTheme } from "../../../../theme";
import { useOwnerListings } from "../../context/OwnerListingsContext";
import DashboardStatCard from "../../components/cards/DashboardStatCard";
import { formatCurrency } from "../../../../utils/format";

export default function AnalyticsScreen() {
  const { analytics, listings, bookingRequests } = useOwnerListings();

  const bookingCountsByRoomId = bookingRequests.reduce((summary, request) => {
    if (request.status !== "Approved") {
      return summary;
    }

    summary[request.roomId] = (summary[request.roomId] || 0) + 1;
    return summary;
  }, {});

  const topPerformers = [...listings]
    .map((listing) => ({
      ...listing,
      bookingCount: bookingCountsByRoomId[listing.id] || 0,
    }))
    .sort((first, second) => second.bookingCount - first.bookingCount)
    .slice(0, 3);

  return (
    <ScreenContainer>
      <SectionHeader
        title="Listing analytics"
        subtitle="Track visibility, enquiries, and booking momentum."
      />

      <View style={styles.grid}>
        <DashboardStatCard label="Earnings" value={formatCurrency(analytics.totalEarnings)} icon="cash-outline" accentColor={appTheme.colors.info} />
        <DashboardStatCard label="Enquiries Count" value={analytics.totalEnquiries} icon="mail-open-outline" accentColor={appTheme.colors.warning} />
        <DashboardStatCard label="Booking Request Count" value={analytics.totalBookingRequests} icon="document-text-outline" accentColor={appTheme.colors.success} />
        <DashboardStatCard label="Unavailable Rooms" value={analytics.unavailableRooms} icon="ban-outline" accentColor={appTheme.colors.danger} />
      </View>

      <View style={styles.card}>
        <Text style={styles.heading}>Top performing listings</Text>
        {topPerformers.map((listing) => (
          <View key={listing.id} style={styles.row}>
            <View style={styles.copy}>
              <Text style={styles.title}>{listing.title}</Text>
              <Text style={styles.meta}>
                Booked {listing.bookingCount} time{listing.bookingCount === 1 ? "" : "s"}
              </Text>
            </View>
            <Text style={styles.status}>{listing.status}</Text>
          </View>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: appTheme.spacing.md,
  },
  card: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.md,
    ...appTheme.shadow,
  },
  heading: {
    fontSize: 20,
    fontWeight: "800",
    color: appTheme.colors.text,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: appTheme.spacing.md,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: appTheme.colors.text,
  },
  meta: {
    color: appTheme.colors.textMuted,
    fontSize: 13,
  },
  status: {
    color: appTheme.colors.primaryDark,
    fontWeight: "700",
    textTransform: "capitalize",
  },
});
