import React from "react";
import ScreenContainer from "../../../../components/common/ScreenContainer";
import EmptyState from "../../../../components/common/EmptyState";
import DeliveryJobCard from "../../components/cards/DeliveryJobCard";
import { useDeliveryJobs } from "../../context/DeliveryJobsContext";

export default function DeliveryHistoryScreen({ navigation }) {
  const { deliveryHistory } = useDeliveryJobs();

  return (
    <ScreenContainer>
      {deliveryHistory.length === 0 ? (
        <EmptyState title="No delivery history yet" description="Completed deliveries will appear here once you finish jobs." icon="time-outline" />
      ) : (
        deliveryHistory.map((job) => (
          <DeliveryJobCard
            key={job.id}
            job={job}
            onPress={() => navigation.navigate("DeliveryDetails", { deliveryId: job.id, source: "history" })}
          />
        ))
      )}
    </ScreenContainer>
  );
}
