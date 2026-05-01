import React, { useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import ScreenContainer from "../../../../components/common/ScreenContainer";
import EmptyState from "../../../../components/common/EmptyState";
import LoadingOverlay from "../../../../components/common/LoadingOverlay";
import DeliveryJobCard from "../../components/cards/DeliveryJobCard";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import { useDeliveryJobs } from "../../context/DeliveryJobsContext";

export default function AvailableJobsScreen({ navigation }) {
  const { availableJobs, loading, acceptJob, loadDeliveryData } = useDeliveryJobs();
  const [selectedJobId, setSelectedJobId] = useState("");

  useFocusEffect(
    React.useCallback(() => {
      loadDeliveryData();
    }, [loadDeliveryData])
  );

  if (loading) {
    return <LoadingOverlay />;
  }

  return (
    <ScreenContainer>
      {availableJobs.length === 0 ? (
        <EmptyState title="No available jobs" description="New delivery requests will appear here when they are assigned." icon="bicycle-outline" />
      ) : (
        availableJobs.map((job) => (
          <DeliveryJobCard
            key={job.id}
            job={job}
            onPress={() => navigation.navigate("DeliveryDetails", { deliveryId: job.id, source: "available" })}
            onAccept={() => setSelectedJobId(job.id)}
          />
        ))
      )}

      <ConfirmationModal
        visible={Boolean(selectedJobId)}
        title="Accept Delivery Job"
        message="Do you want to accept this delivery job now?"
        confirmLabel="Accept"
        onConfirm={async () => {
          await acceptJob(selectedJobId);
          setSelectedJobId("");
          navigation.navigate("DeliveryDetails", { deliveryId: selectedJobId, source: "active" });
        }}
        onCancel={() => setSelectedJobId("")}
      />
    </ScreenContainer>
  );
}
