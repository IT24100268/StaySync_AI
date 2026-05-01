import React, { useMemo, useState } from "react";
import EmptyState from "../../../../components/common/EmptyState";
import LoadingOverlay from "../../../../components/common/LoadingOverlay";
import ScreenContainer from "../../../../components/common/ScreenContainer";
import SectionHeader from "../../../../components/common/SectionHeader";
import ApprovalRequestCard from "../../components/cards/ApprovalRequestCard";
import FilterTabs from "../../components/common/FilterTabs";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import { useApprovalManagement } from "../../context/ApprovalManagementContext";
import { ADMIN_ACTIONS, APPROVAL_STATUS_OPTIONS, APPROVAL_TYPES } from "../../utils/constants";

export default function RestaurantApprovalScreen({ navigation }) {
  const { restaurantApprovals, loading, updateApprovalStatus } = useApprovalManagement();
  const [statusFilter, setStatusFilter] = useState("all");
  const [pendingAction, setPendingAction] = useState(null);

  const filteredApprovals = useMemo(
    () =>
      restaurantApprovals.filter(
        (item) => statusFilter === "all" || item.status === statusFilter
      ),
    [restaurantApprovals, statusFilter]
  );

  async function handleConfirmAction() {
    if (!pendingAction) {
      return;
    }

    const status = pendingAction.action === ADMIN_ACTIONS.APPROVE ? "Approved" : "Rejected";
    await updateApprovalStatus(APPROVAL_TYPES.RESTAURANT, pendingAction.id, status);
    setPendingAction(null);
  }

  if (loading) {
    return <LoadingOverlay />;
  }

  return (
    <ScreenContainer>
      <SectionHeader title="Restaurant approvals" subtitle="Verify restaurants before they go live in the student marketplace." />
      <FilterTabs options={APPROVAL_STATUS_OPTIONS} value={statusFilter} onChange={setStatusFilter} />
      <FilterTabs
        options={["rooms", "restaurants", "delivery"]}
        value="restaurants"
        onChange={(next) => {
          if (next === "rooms") {
            navigation.replace("RoomApproval");
          }
          if (next === "delivery") {
            navigation.replace("DeliveryApproval");
          }
        }}
      />

      {filteredApprovals.length === 0 ? (
        <EmptyState title="No restaurant approvals" description="There are no restaurant approval requests in this filter." icon="restaurant-outline" />
      ) : (
        filteredApprovals.map((item) => (
          <ApprovalRequestCard
            key={item.id}
            title={item.restaurantName}
            subtitle={`${item.ownerName} · ${item.address}`}
            meta={`Submitted: ${item.submittedAt}`}
            status={item.status}
            onOpen={() =>
              navigation.navigate("ApprovalDetails", {
                approvalType: APPROVAL_TYPES.RESTAURANT,
                approvalId: item.id,
              })
            }
            onApprove={() => setPendingAction({ id: item.id, action: ADMIN_ACTIONS.APPROVE })}
            onReject={() => setPendingAction({ id: item.id, action: ADMIN_ACTIONS.REJECT })}
          />
        ))
      )}

      <ConfirmationModal
        visible={Boolean(pendingAction)}
        title={pendingAction?.action === ADMIN_ACTIONS.APPROVE ? "Approve restaurant?" : "Reject restaurant?"}
        message="This action will update the restaurant approval queue immediately."
        confirmLabel={pendingAction?.action === ADMIN_ACTIONS.APPROVE ? "Approve" : "Reject"}
        onConfirm={handleConfirmAction}
        onCancel={() => setPendingAction(null)}
      />
    </ScreenContainer>
  );
}
