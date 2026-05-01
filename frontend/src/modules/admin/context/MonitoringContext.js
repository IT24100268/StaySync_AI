import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRoleAuth } from "../../../context/RoleAuthContext";
import { fetchOrderMonitor } from "../services/adminOrderService";
import { fetchReportsAndLogs } from "../services/adminReportService";

const MonitoringContext = createContext(null);

export function MonitoringProvider({ children }) {
  const { role, token } = useRoleAuth();
  const [reports, setReports] = useState([]);
  const [logs, setLogs] = useState([]);
  const [orderMonitor, setOrderMonitor] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMonitoring = useCallback(async () => {
    if (role !== "admin" || !token) {
      setReports([]);
      setLogs([]);
      setOrderMonitor([]);
      setError("");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [reportsResponse, ordersResponse] = await Promise.all([
        fetchReportsAndLogs(),
        fetchOrderMonitor(),
      ]);

      setReports(reportsResponse.reports);
      setLogs(reportsResponse.logs);
      setOrderMonitor(ordersResponse);
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Unable to load monitoring data.");
    } finally {
      setLoading(false);
    }
  }, [role, token]);

  useEffect(() => {
    if (role === "admin" && token) {
      loadMonitoring();
      return;
    }

    setReports([]);
    setLogs([]);
    setOrderMonitor([]);
    setError("");
    setLoading(false);
  }, [loadMonitoring, role, token]);

  function getReportDetails(reportId) {
    return [...reports, ...logs].find((item) => item.id === reportId) || null;
  }

  const summary = {
    activeOrders: orderMonitor.filter((item) => item.status === "ongoing").length,
    disputesCount: orderMonitor.filter((item) => item.disputeStatus !== "none").length,
    complaints: reports.filter((item) => item.type === "Complaint").length,
    flaggedListings: reports.filter((item) => item.type === "Flagged Listing").length,
    suspiciousActivities: reports.filter((item) => item.type === "Suspicious Activity").length,
  };

  const value = useMemo(
    () => ({
      reports,
      logs,
      orderMonitor,
      loading,
      error,
      summary,
      loadMonitoring,
      getReportDetails,
    }),
    [error, loadMonitoring, loading, logs, orderMonitor, reports]
  );

  return <MonitoringContext.Provider value={value}>{children}</MonitoringContext.Provider>;
}

export function useMonitoring() {
  const context = useContext(MonitoringContext);

  if (!context) {
    throw new Error("useMonitoring must be used within MonitoringProvider");
  }

  return context;
}
