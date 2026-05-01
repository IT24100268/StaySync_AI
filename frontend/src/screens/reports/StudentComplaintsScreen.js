import React, { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import ScreenContainer from "../../components/common/ScreenContainer";
import EmptyState from "../../components/common/EmptyState";
import LoadingOverlay from "../../components/common/LoadingOverlay";
import ComplaintListItem from "../../components/reports/ComplaintListItem";
import AppButton from "../../components/common/AppButton";
import { useAuth } from "../../context/AuthContext";
import { fetchStudentReports } from "../../services/reportService";
import { appTheme } from "../../theme";

export default function StudentComplaintsScreen({ navigation }) {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadComplaints = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchStudentReports(user?.id);
      setComplaints(response);
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Unable to load your complaints right now.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadComplaints();
    }, [loadComplaints])
  );

  if (loading) {
    return <LoadingOverlay />;
  }

  return (
    <ScreenContainer>
      <View style={styles.hero}>
        <Text style={styles.title}>Complaints & Reports</Text>
        <Text style={styles.subtitle}>
          Review issue reports you have submitted and track their progress.
        </Text>
      </View>

      <View style={styles.actionRow}>
        <Pressable onPress={loadComplaints}>
          <Text style={styles.refreshLink}>Refresh</Text>
        </Pressable>
        <AppButton
          title="New Report"
          onPress={() =>
            navigation.navigate("ComplaintForm", {
              mode: "general",
              title: "Submit a complaint",
            })
          }
        />
      </View>

      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {complaints.length === 0 ? (
        <EmptyState
          title="No complaints yet"
          description="Reports you submit about rooms, food, or other issues will appear here."
          icon="document-text-outline"
        />
      ) : (
        complaints.map((complaint) => (
          <ComplaintListItem
            key={complaint.id}
            complaint={complaint}
            onPress={() => navigation.navigate("ComplaintDetails", { complaint })}
          />
        ))
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: appTheme.colors.primary,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.sm,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
  },
  subtitle: {
    color: "rgba(255,255,255,0.9)",
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: appTheme.spacing.md,
  },
  refreshLink: {
    color: appTheme.colors.primary,
    fontWeight: "800",
    fontSize: 14,
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
});
