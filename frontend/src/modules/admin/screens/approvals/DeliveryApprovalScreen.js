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

export default function DeliveryApprovalScreen({ navigation }) {
  const { deliveryApprovals, loading, updateApprovalStatus } = useApprovalManagement();
  const [statusFilter, setStatusFilter] = useState("all");
  const [pendingAction, setPendingAction] = useState(null);

  const filteredApprovals = useMemo(
    () =>
      deliveryApprovals.filter(
        (item) => statusFilter === "all" || item.status === statusFilter
      ),
    [deliveryApprovals, statusFilter]
  );

  async function handleConfirmAction() {
    if (!pendingAction) {
      return;
    }

    const status = pendingAction.action === ADMIN_ACTIONS.APPROVE ? "Approved" : "Rejected";
    await updateApprovalStatus(APPROVAL_TYPES.DELIVERY, pendingAction.id, status);
    setPendingAction(null);
  }

  if (loading) {
    return <LoadingOverlay />;
  }

  return (
    <ScreenContainer>
      <SectionHeader title="Delivery partner approvals" subtitle="Validate new delivery partners before assigning live jobs." />
      <FilterTabs options={APPROVAL_STATUS_OPTIONS} value={statusFilter} onChange={setStatusFilter} />
      <FilterTabs
        options={["rooms", "restaurants", "delivery"]}
        value="delivery"
        onChange={(next) => {
          if (next === "rooms") {
            navigation.replace("RoomApproval");
          }
          if (next === "restaurants") {
            navigation.replace("RestaurantApproval");
          }
        }}
      />

      {filteredApprovals.length === 0 ? (
        <EmptyState title="No delivery approvals" description="There are no delivery partner approval requests in this filter." icon="bicycle-outline" />
      ) : (
        filteredApprovals.map((item) => (
          <ApprovalRequestCard
            key={item.id}
            title={item.partnerName}
            subtitle={`${item.vehicleType} · ${item.phone}`}
            meta={`Submitted: ${item.submittedAt}`}
            status={item.status}
            onOpen={() =>
              navigation.navigate("ApprovalDetails", {
                approvalType: APPROVAL_TYPES.DELIVERY,
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
        title={pendingAction?.action === ADMIN_ACTIONS.APPROVE ? "Approve delivery partner?" : "Reject delivery partner?"}
        message="This action will update the delivery partner approval queue immediately."
        confirmLabel={pendingAction?.action === ADMIN_ACTIONS.APPROVE ? "Approve" : "Reject"}
        onConfirm={handleConfirmAction}
        onCancel={() => setPendingAction(null)}
      />
    </ScreenContainer>
  );
}
