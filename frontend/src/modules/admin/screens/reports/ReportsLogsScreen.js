import React, { useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import EmptyState from "../../../../components/common/EmptyState";
import LoadingOverlay from "../../../../components/common/LoadingOverlay";
import ScreenContainer from "../../../../components/common/ScreenContainer";
import SectionHeader from "../../../../components/common/SectionHeader";
import ReportCard from "../../components/cards/ReportCard";
import FilterTabs from "../../components/common/FilterTabs";
import { useMonitoring } from "../../context/MonitoringContext";
import { REPORT_STATUS_FILTERS } from "../../utils/constants";

export default function ReportsLogsScreen({ navigation }) {
  const { reports, loading, loadMonitoring } = useMonitoring();
  const [statusFilter, setStatusFilter] = useState("all");
  const items = reports;

  useFocusEffect(
    React.useCallback(() => {
      loadMonitoring();
    }, [loadMonitoring])
  );

  const filteredItems = useMemo(
    () => items.filter((item) => statusFilter === "all" || item.status === statusFilter),
    [items, statusFilter]
  );

  if (loading) {
    return <LoadingOverlay />;
  }

  return (
    <ScreenContainer>
      <SectionHeader title="Complaints" subtitle="Review submitted complaints, track status, and open any report for moderation." />
      <FilterTabs options={REPORT_STATUS_FILTERS} value={statusFilter} onChange={setStatusFilter} />

      {filteredItems.length === 0 ? (
        <EmptyState title="No complaints found" description="There are no complaint reports in this status right now." icon="document-text-outline" />
      ) : (
        filteredItems.map((item) => (
          <ReportCard
            key={item.id}
            item={item}
            onPress={() => navigation.navigate("ReportDetails", { reportId: item.id })}
          />
        ))
      )}
    </ScreenContainer>
  );
}
