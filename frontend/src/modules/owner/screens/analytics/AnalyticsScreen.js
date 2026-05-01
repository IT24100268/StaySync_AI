import React from "react";
import { StyleSheet, Text, View } from "react-native";
import ScreenContainer from "../../../../components/common/ScreenContainer";
import SectionHeader from "../../../../components/common/SectionHeader";
import { appTheme } from "../../../../theme";
import { useOwnerListings } from "../../context/OwnerListingsContext";
import DashboardStatCard from "../../components/cards/DashboardStatCard";

export default function AnalyticsScreen() {
  const { analytics, listings } = useOwnerListings();

  const topPerformers = [...listings]
    .sort((first, second) => second.viewsCount - first.viewsCount)
    .slice(0, 3);

  return (
    <ScreenContainer>
      <SectionHeader
        title="Listing analytics"
        subtitle="Track visibility, enquiries, and booking momentum."
      />

      <View style={styles.grid}>
        <DashboardStatCard label="Views Count" value={analytics.totalViews} icon="eye-outline" accentColor={appTheme.colors.info} />
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
                Views {listing.viewsCount} • Enquiries {listing.enquiriesCount}
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
