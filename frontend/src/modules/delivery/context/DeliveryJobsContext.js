import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRoleAuth } from "../../../context/RoleAuthContext";
import {
  acceptDeliveryJob,
  fetchAvailableJobs,
  fetchAssignedJobs,
  fetchDeliveryEarnings,
  fetchLiveLocation,
  shareLiveLocation,
  updateDeliveryStatus,
  updatePartnerAvailability,
} from "../services/deliveryJobService";

const DeliveryJobsContext = createContext(null);

function isSameDay(firstDate, secondDate) {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

function isSameMonth(firstDate, secondDate) {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth()
  );
}

function getWeekStart(date) {
  const nextDate = new Date(date);
  const day = nextDate.getDay();
  const diff = nextDate.getDate() - day + (day === 0 ? -6 : 1);
  nextDate.setDate(diff);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

export function DeliveryJobsProvider({ children }) {
  const { role, token } = useRoleAuth();
  const [availableJobs, setAvailableJobs] = useState([]);
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [deliveryHistory, setDeliveryHistory] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [liveLocation, setLiveLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadDeliveryData = useCallback(async () => {
    if (role !== "delivery" || !token) {
      setAvailableJobs([]);
      setActiveDelivery(null);
      setDeliveryHistory([]);
      setEarnings(null);
      setLiveLocation(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [jobsResponse, assignedResponse, earningsResponse, locationResponse] =
        await Promise.all([
          fetchAvailableJobs(),
          fetchAssignedJobs(),
          fetchDeliveryEarnings(),
          fetchLiveLocation(),
        ]);

      const deliveredJobs = assignedResponse.filter((job) => job.status === "Delivered");
      const nextActiveDelivery =
        assignedResponse.find((job) => job.status !== "Delivered") || null;

      setAvailableJobs(jobsResponse);
      setActiveDelivery(nextActiveDelivery);
      setDeliveryHistory(deliveredJobs);
      setEarnings(earningsResponse);
      setLiveLocation(locationResponse);
    } finally {
      setLoading(false);
    }
  }, [role, token]);

  useEffect(() => {
    loadDeliveryData();
  }, [role, token, loadDeliveryData]);

  async function acceptJob(deliveryId) {
    setSubmitting(true);
    try {
      const acceptedJob = await acceptDeliveryJob(deliveryId);
      setActiveDelivery(acceptedJob);
      setAvailableJobs((current) =>
        current.filter((entry) => String(entry.id) !== String(deliveryId))
      );
      await loadDeliveryData();
      return { success: true, job: acceptedJob };
    } catch (error) {
      return { success: false, message: error.message || "Unable to accept job." };
    } finally {
      setSubmitting(false);
    }
  }

  async function setDeliveryStatus(status) {
    if (!activeDelivery) {
      return { success: false, message: "No active delivery found." };
    }

    setSubmitting(true);
    try {
      const updated = await updateDeliveryStatus(activeDelivery.id, status);
      setActiveDelivery(updated);

      if (status === "Delivered") {
        setDeliveryHistory((current) => [updated, ...current]);
        setActiveDelivery(null);
      }

      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || "Unable to update delivery status." };
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleAvailability(statusOnline) {
    try {
      const response = await updatePartnerAvailability(statusOnline);
      return { success: true, statusOnline: response.statusOnline, partner: response.partner };
    } catch (error) {
      return { success: false, message: error.message || "Unable to update availability." };
    }
  }

  async function pushLiveLocation(payload) {
    const response = await shareLiveLocation(payload);
    setLiveLocation(response);
    return response;
  }

  const computedEarnings = useMemo(() => {
    const now = new Date();
    const currentWeekStart = getWeekStart(now);

    const totals = deliveryHistory.reduce(
      (summary, delivery) => {
        const amount = Number(delivery.estimatedEarnings || 0);
        const deliveryDate = new Date(delivery.deliveredAt || delivery.createdAt || now);

        if (isSameDay(deliveryDate, now)) {
          summary.todayEarnings += amount;
        }

        if (deliveryDate >= currentWeekStart) {
          summary.weeklyEarnings += amount;
        }

        if (isSameMonth(deliveryDate, now)) {
          summary.monthlyEarnings += amount;
        }

        return summary;
      },
      {
        todayEarnings: 0,
        weeklyEarnings: 0,
        monthlyEarnings: 0,
        completedDeliveries: deliveryHistory.length,
      }
    );

    return totals;
  }, [deliveryHistory]);

  const analytics = useMemo(() => {
    const activeDeliveries = activeDelivery ? 1 : 0;
    const completedDeliveries = deliveryHistory.filter(
      (delivery) => delivery.status === "Delivered"
    ).length;
    const totalDeliveries = availableJobs.length + activeDeliveries + deliveryHistory.length;

    return {
      totalDeliveries,
      activeDeliveries,
      completedDeliveries,
      todayEarnings: computedEarnings.todayEarnings,
      weeklyEarnings: computedEarnings.weeklyEarnings,
      monthlyEarnings: computedEarnings.monthlyEarnings,
      completedJobsCount: computedEarnings.completedDeliveries || completedDeliveries,
    };
  }, [activeDelivery, availableJobs.length, computedEarnings, deliveryHistory]);

  const value = useMemo(
    () => ({
      availableJobs,
      activeDelivery,
      deliveryHistory,
      earnings: computedEarnings,
      liveLocation,
      analytics,
      loading,
      submitting,
      acceptJob,
      setDeliveryStatus,
      toggleAvailability,
      pushLiveLocation,
      loadDeliveryData,
    }),
    [
      activeDelivery,
      analytics,
      availableJobs,
      computedEarnings,
      deliveryHistory,
      liveLocation,
      loading,
      loadDeliveryData,
      submitting,
    ]
  );

  return <DeliveryJobsContext.Provider value={value}>{children}</DeliveryJobsContext.Provider>;
}

export function useDeliveryJobs() {
  const context = useContext(DeliveryJobsContext);
  if (!context) {
    throw new Error("useDeliveryJobs must be used within DeliveryJobsProvider");
  }
  return context;
}
