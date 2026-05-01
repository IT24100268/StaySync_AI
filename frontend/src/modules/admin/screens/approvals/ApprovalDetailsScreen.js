import React from "react";
import { StyleSheet, Text, View } from "react-native";
import AppButton from "../../../../components/common/AppButton";
import ScreenContainer from "../../../../components/common/ScreenContainer";
import SectionHeader from "../../../../components/common/SectionHeader";
import { appTheme } from "../../../../theme";
import StatusBadge from "../../components/cards/StatusBadge";
import { useApprovalManagement } from "../../context/ApprovalManagementContext";
import { APPROVAL_TYPES } from "../../utils/constants";

export default function ApprovalDetailsScreen({ route }) {
  const { approvalType, approvalId } = route.params;
  const { getApprovalDetails, updateApprovalStatus } = useApprovalManagement();
  const approval = getApprovalDetails(approvalType, approvalId);

  if (!approval) {
    return (
      <ScreenContainer>
        <Text>Approval request not found.</Text>
      </ScreenContainer>
    );
  }

  const title =
    approvalType === APPROVAL_TYPES.ROOM
      ? approval.roomTitle
      : approvalType === APPROVAL_TYPES.RESTAURANT
        ? approval.restaurantName
        : approval.partnerName;

  return (
    <ScreenContainer>
      <View style={styles.headerCard}>
        <Text style={styles.title}>{title}</Text>
        <StatusBadge status={approval.status} />
      </View>

      <View style={styles.card}>
        <SectionHeader title="Approval details" subtitle="Moderation data prepared for backend review flows." />
        {Object.entries(approval).map(([key, value]) => (
          <View key={key} style={styles.row}>
            <Text style={styles.rowLabel}>{key}</Text>
            <Text style={styles.rowValue}>{String(value)}</Text>
          </View>
        ))}
      </View>

      <AppButton title="Approve" onPress={() => updateApprovalStatus(approvalType, approvalId, "Approved")} />
      <AppButton title="Reject" variant="secondary" onPress={() => updateApprovalStatus(approvalType, approvalId, "Rejected")} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: appTheme.colors.primaryDark,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.xl,
    gap: appTheme.spacing.sm,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
  },
  card: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.md,
    ...appTheme.shadow,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: appTheme.spacing.md,
  },
  rowLabel: {
    color: appTheme.colors.textMuted,
    flex: 1,
  },
  rowValue: {
    color: appTheme.colors.text,
    fontWeight: "700",
    flex: 1,
    textAlign: "right",
  },
});
