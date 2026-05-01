import React from "react";
import { StyleSheet, Text, View } from "react-native";
import ScreenContainer from "../../components/common/ScreenContainer";
import ComplaintStatusBadge from "../../components/reports/ComplaintStatusBadge";
import { appTheme } from "../../theme";

function DetailRow({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function ComplaintDetailsScreen({ route }) {
  const complaint = route.params?.complaint;

  if (!complaint) {
    return (
      <ScreenContainer>
        <View style={styles.card}>
          <Text style={styles.title}>Complaint not found</Text>
          <Text style={styles.description}>The selected complaint details are unavailable.</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>Complaint Type</Text>
        <Text style={styles.title}>{complaint.type}</Text>
        <ComplaintStatusBadge status={complaint.status} />
      </View>

      <View style={styles.card}>
        <DetailRow
          label="Created"
          value={complaint.createdAt ? new Date(complaint.createdAt).toLocaleString() : "Just now"}
        />
        <DetailRow label="Target ID" value={complaint.targetId || "General report"} />
        <DetailRow label="Submitted by" value="Student" />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{complaint.description}</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.sm,
    ...appTheme.shadow,
  },
  heroLabel: {
    color: appTheme.colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  title: {
    color: appTheme.colors.text,
    fontSize: 24,
    fontWeight: "800",
  },
  card: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.md,
    ...appTheme.shadow,
  },
  sectionTitle: {
    color: appTheme.colors.text,
    fontSize: 17,
    fontWeight: "800",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: appTheme.spacing.md,
  },
  rowLabel: {
    color: appTheme.colors.textMuted,
    fontSize: 14,
  },
  rowValue: {
    flex: 1,
    color: appTheme.colors.text,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "right",
  },
  description: {
    color: appTheme.colors.textMuted,
    lineHeight: 22,
  },
});
