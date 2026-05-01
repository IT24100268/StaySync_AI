import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRoleAuth } from "../../../context/RoleAuthContext";
import { APPROVAL_TYPES } from "../utils/constants";
import {
  fetchApprovalRequests,
  updateApprovalRequestStatus,
} from "../services/adminApprovalService";

const ApprovalManagementContext = createContext(null);

function updateCollection(items, id, status) {
  return items.map((item) => (item.id === id ? { ...item, status } : item));
}

export function ApprovalManagementProvider({ children }) {
  const { role, token } = useRoleAuth();
  const [roomApprovals, setRoomApprovals] = useState([]);
  const [restaurantApprovals, setRestaurantApprovals] = useState([]);
  const [deliveryApprovals, setDeliveryApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadApprovals() {
    if (role !== "admin" || !token) {
      setRoomApprovals([]);
      setRestaurantApprovals([]);
      setDeliveryApprovals([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetchApprovalRequests();
      setRoomApprovals(response.roomApprovals);
      setRestaurantApprovals(response.restaurantApprovals);
      setDeliveryApprovals(response.deliveryApprovals);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (role === "admin" && token) {
      loadApprovals();
      return;
    }

    setRoomApprovals([]);
    setRestaurantApprovals([]);
    setDeliveryApprovals([]);
    setLoading(false);
  }, [role, token]);

  async function updateApprovalStatus(type, id, status) {
    const registry = await updateApprovalRequestStatus(type, id, status);

    setRoomApprovals(registry.roomApprovals);
    setRestaurantApprovals(registry.restaurantApprovals);
    setDeliveryApprovals(registry.deliveryApprovals);

    return { success: true };
  }

  function getApprovalByType(type) {
    if (type === APPROVAL_TYPES.RESTAURANT) return restaurantApprovals;
    if (type === APPROVAL_TYPES.DELIVERY) return deliveryApprovals;
    return roomApprovals;
  }

  function getApprovalDetails(type, id) {
    return getApprovalByType(type).find((item) => item.id === id) || null;
  }

  const summary = {
    pendingRoomListings: roomApprovals.filter((item) => item.status === "Pending").length,
    pendingRestaurantApprovals: restaurantApprovals.filter((item) => item.status === "Pending").length,
    pendingDeliveryApprovals: deliveryApprovals.filter((item) => item.status === "Pending").length,
  };

  const value = useMemo(
    () => ({
      roomApprovals,
      restaurantApprovals,
      deliveryApprovals,
      loading,
      summary,
      loadApprovals,
      updateApprovalStatus,
      getApprovalByType,
      getApprovalDetails,
    }),
    [deliveryApprovals, loading, restaurantApprovals, roomApprovals]
  );

  return (
    <ApprovalManagementContext.Provider value={value}>
      {children}
    </ApprovalManagementContext.Provider>
  );
}

export function useApprovalManagement() {
  const context = useContext(ApprovalManagementContext);

  if (!context) {
    throw new Error("useApprovalManagement must be used within ApprovalManagementProvider");
  }

  return context;
}
