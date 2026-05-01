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

export default function RoomApprovalScreen({ navigation }) {
  const { roomApprovals, loading, updateApprovalStatus } = useApprovalManagement();
  const [statusFilter, setStatusFilter] = useState("all");
  const [pendingAction, setPendingAction] = useState(null);

  const filteredApprovals = useMemo(
    () =>
      roomApprovals.filter(
        (item) => statusFilter === "all" || item.status === statusFilter
      ),
    [roomApprovals, statusFilter]
  );

  async function handleConfirmAction() {
    if (!pendingAction) {
      return;
    }

    const status = pendingAction.action === ADMIN_ACTIONS.APPROVE ? "Approved" : "Rejected";
    await updateApprovalStatus(APPROVAL_TYPES.ROOM, pendingAction.id, status);
    setPendingAction(null);
  }

  if (loading) {
    return <LoadingOverlay />;
  }

  return (
    <ScreenContainer>
      <SectionHeader title="Room listing approvals" subtitle="Review and moderate submitted room inventory." />
      <FilterTabs options={APPROVAL_STATUS_OPTIONS} value={statusFilter} onChange={setStatusFilter} />
      <FilterTabs
        options={["rooms", "restaurants", "delivery"]}
        value="rooms"
        onChange={(next) => {
          if (next === "restaurants") {
            navigation.replace("RestaurantApproval");
          }
          if (next === "delivery") {
            navigation.replace("DeliveryApproval");
          }
        }}
      />

      {filteredApprovals.length === 0 ? (
        <EmptyState title="No room approvals" description="There are no room approval requests in this filter." icon="bed-outline" />
      ) : (
        filteredApprovals.map((item) => (
          <ApprovalRequestCard
            key={item.id}
            title={item.roomTitle}
            subtitle={`${item.ownerName} · ${item.location}`}
            meta={`Rent: Rs. ${item.rent} · Submitted: ${item.submittedAt}`}
            status={item.status}
            onOpen={() =>
              navigation.navigate("ApprovalDetails", {
                approvalType: APPROVAL_TYPES.ROOM,
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
        title={pendingAction?.action === ADMIN_ACTIONS.APPROVE ? "Approve room listing?" : "Reject room listing?"}
        message="This action will update the room approval queue immediately."
        confirmLabel={pendingAction?.action === ADMIN_ACTIONS.APPROVE ? "Approve" : "Reject"}
        onConfirm={handleConfirmAction}
        onCancel={() => setPendingAction(null)}
      />
    </ScreenContainer>
  );
}
