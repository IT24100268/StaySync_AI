import React from "react";
import ScreenContainer from "../../../../components/common/ScreenContainer";
import SectionHeader from "../../../../components/common/SectionHeader";
import { useDeliveryJobs } from "../../context/DeliveryJobsContext";
import EarningsSummaryCard from "../../components/cards/EarningsSummaryCard";
import DashboardStatCard from "../../components/cards/DashboardStatCard";
import { appTheme } from "../../../../theme";

export default function EarningsScreen() {
  const { earnings, analytics } = useDeliveryJobs();

  return (
    <ScreenContainer>
      <SectionHeader title="Earnings" subtitle="Track daily, weekly, and monthly performance." />
      <EarningsSummaryCard earnings={earnings || {
        todayEarnings: 0,
        weeklyEarnings: 0,
        monthlyEarnings: 0,
        completedDeliveries: 0,
      }} />
      <DashboardStatCard label="Completed Jobs" value={analytics.completedJobsCount} icon="checkmark-done-outline" accentColor={appTheme.colors.success} />
    </ScreenContainer>
  );
}
