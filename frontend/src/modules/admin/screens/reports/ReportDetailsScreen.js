import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import ScreenContainer from "../../../../components/common/ScreenContainer";
import SectionHeader from "../../../../components/common/SectionHeader";
import AppButton from "../../../../components/common/AppButton";
import LoadingOverlay from "../../../../components/common/LoadingOverlay";
import { useToast } from "../../../../context/ToastContext";
import { appTheme } from "../../../../theme";
import StatusBadge from "../../components/cards/StatusBadge";
import {
  blockComplaintUser,
  fetchAdminReportById,
  fetchAdminReportLogs,
  markAdminReportResolved,
  removeComplaintListing,
  rejectAdminComplaint,
  updateAdminReport,
} from "../../services/adminReportService";

function DetailRow({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value || "-"}</Text>
    </View>
  );
}

export default function ReportDetailsScreen({ route, navigation }) {
  const { reportId } = route.params;
  const { showToast } = useToast();
  const [report, setReport] = useState(null);
  const [relatedData, setRelatedData] = useState({
    previousComplaintsCount: 0,
    recentActivityLogs: [],
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadDetails();
  }, [reportId]);

  async function loadDetails() {
    try {
      setLoading(true);
      let detail = await fetchAdminReportById(reportId);

      if (detail.statusRaw === "open") {
        detail = await updateAdminReport(reportId, {
          status: "in_review",
          actionTaken: detail.actionTaken || "Admin review started",
        });
      }

      setReport(detail);

      if (detail.targetId) {
        const logs = await fetchAdminReportLogs(detail.targetId);
        setRelatedData(logs);
      } else {
        setRelatedData({
          previousComplaintsCount: 0,
          recentActivityLogs: [],
        });
      }

      setError("");
    } catch (loadError) {
      setError(loadError.message || "Unable to load complaint details.");
    } finally {
      setLoading(false);
    }
  }

  async function completeAction(actionKey, action) {
    try {
      setActionLoading(actionKey);
      await action();
      showToast("Complaint updated successfully.", "success");
      navigation.goBack();
    } catch (actionError) {
      setError(actionError.message || "Unable to complete this complaint action.");
      showToast(actionError.message || "Unable to complete this complaint action.", "error");
    } finally {
      setActionLoading("");
    }
  }

  if (loading) {
    return <LoadingOverlay />;
  }

  if (!report) {
    return (
      <ScreenContainer>
        <View style={styles.card}>
          <Text style={styles.emptyText}>{error || "Complaint not found."}</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.headerCard}>
        <Text style={styles.type}>{report.type}</Text>
        <Text style={styles.title}>{report.title}</Text>
        <StatusBadge status={report.status} />
      </View>

      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <SectionHeader title="Complaint Details" subtitle="Review the submitted complaint before taking action." />
        <DetailRow label="Complaint Type" value={report.type} />
        <DetailRow label="Status" value={report.status} />
        <DetailRow label="Created Date" value={report.createdAt} />
        <DetailRow label="Reported By" value={report.reportedBy?.name} />
        <DetailRow label="Email" value={report.reportedBy?.email} />
        <DetailRow label="Target" value={report.targetType} />
        <DetailRow label="Target ID" value={report.targetId || "General complaint"} />
        {report.target?.title ? <DetailRow label="Target Title" value={report.target.title} /> : null}
        {report.target?.status ? <DetailRow label="Target Status" value={report.target.status} /> : null}
        {report.actionTaken ? <DetailRow label="Action Taken" value={report.actionTaken} /> : null}
        <View style={styles.copyBlock}>
          <Text style={styles.blockLabel}>Description</Text>
          <Text style={styles.description}>{report.description}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <SectionHeader title="Logs & Related Data" subtitle="Context to help review similar complaint patterns." />
        <DetailRow
          label="Previous complaints"
          value={String(relatedData.previousComplaintsCount || 0)}
        />
        {relatedData.recentActivityLogs.length > 0 ? (
          relatedData.recentActivityLogs.map((item) => (
            <View key={item.id} style={styles.logItem}>
              <Text style={styles.logMessage}>{item.message}</Text>
              <Text style={styles.logDate}>{item.createdAt}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.mutedText}>No related activity logs were found for this target.</Text>
        )}
      </View>

      <View style={styles.card}>
        <SectionHeader title="Review Actions" subtitle="Choose the action that best resolves this complaint." />
        <AppButton
          title="Mark as Resolved"
          loading={actionLoading === "resolved"}
          onPress={() =>
            completeAction("resolved", async () => {
              const updated = await markAdminReportResolved(report.id);
              setReport(updated);
            })
          }
        />
        <AppButton
          title="Reject Complaint"
          variant="secondary"
          loading={actionLoading === "rejected"}
          onPress={() =>
            completeAction("rejected", async () => {
              const updated = await rejectAdminComplaint(report.id);
              setReport(updated);
            })
          }
        />
        <AppButton
          title="Block User"
          variant="secondary"
          loading={actionLoading === "block"}
          disabled={!report.reportedBy?.id}
          onPress={() =>
            completeAction("block", async () => {
              await blockComplaintUser(
                report.reportedBy.id,
                `Blocked after complaint review: ${report.type}`
              );
              const updated = await updateAdminReport(report.id, {
                status: "resolved",
                actionTaken: "Reported user blocked",
              });
              setReport(updated);
            })
          }
        />
        <AppButton
          title="Remove Listing"
          variant="secondary"
          loading={actionLoading === "listing"}
          disabled={report.targetType !== "Room" || !report.targetId}
          onPress={() =>
            completeAction("listing", async () => {
              await removeComplaintListing(report.targetId);
              const updated = await updateAdminReport(report.id, {
                status: "resolved",
                actionTaken: "Listing removed",
              });
              setReport(updated);
            })
          }
        />
      </View>
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
  type: {
    color: "rgba(255,255,255,0.78)",
    textTransform: "uppercase",
    fontSize: 12,
    letterSpacing: 1,
  },
  title: {
    color: "#FFFFFF",
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
  errorCard: {
    backgroundColor: "#FFF4F4",
    borderRadius: appTheme.radius.md,
    padding: appTheme.spacing.md,
    borderWidth: 1,
    borderColor: "#F1CDCD",
  },
  errorText: {
    color: appTheme.colors.danger,
    lineHeight: 20,
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
  copyBlock: {
    gap: appTheme.spacing.sm,
  },
  blockLabel: {
    color: appTheme.colors.text,
    fontWeight: "800",
  },
  description: {
    color: appTheme.colors.text,
    lineHeight: 22,
  },
  logItem: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.md,
    padding: appTheme.spacing.md,
    gap: appTheme.spacing.xs,
    backgroundColor: "#FBFDFF",
  },
  logMessage: {
    color: appTheme.colors.text,
    lineHeight: 20,
  },
  logDate: {
    color: appTheme.colors.textMuted,
    fontSize: 12,
  },
  mutedText: {
    color: appTheme.colors.textMuted,
  },
  emptyText: {
    color: appTheme.colors.text,
    fontWeight: "700",
  },
});
