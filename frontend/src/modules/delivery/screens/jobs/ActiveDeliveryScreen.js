import React from "react";
import ScreenContainer from "../../../../components/common/ScreenContainer";
import EmptyState from "../../../../components/common/EmptyState";
import AppButton from "../../../../components/common/AppButton";
import ActiveDeliveryCard from "../../components/cards/ActiveDeliveryCard";
import { useDeliveryJobs } from "../../context/DeliveryJobsContext";

export default function ActiveDeliveryScreen({ navigation }) {
  const { activeDelivery } = useDeliveryJobs();

  if (!activeDelivery) {
    return (
      <ScreenContainer>
        <EmptyState title="No active delivery" description="Accept an available job to start navigating and updating status." icon="navigate-outline" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ActiveDeliveryCard
        delivery={activeDelivery}
        onOpen={() => navigation.navigate("DeliveryDetails", { deliveryId: activeDelivery.id, source: "active" })}
        onNavigate={() => navigation.navigate("NavigationAssist")}
      />
      <AppButton title="Open Delivery Details" onPress={() => navigation.navigate("DeliveryDetails", { deliveryId: activeDelivery.id, source: "active" })} />
      <AppButton title="Navigation Assistance" variant="secondary" onPress={() => navigation.navigate("NavigationAssist")} />
    </ScreenContainer>
  );
}
