import apiClient from "./apiClient";
import { getReportStatusLabel } from "../constants/reports";

function normalizeReport(report) {
  return {
    id: report._id || report.id,
    userId: report.user?._id || report.user || "",
    studentId: report.student?._id || report.student || "",
    userRole: report.userRole || "student",
    type: report.type || "Other",
    targetId: report.targetId || "",
    description: report.description || "",
    status: report.status || "open",
    statusLabel: getReportStatusLabel(report.status),
    createdAt: report.createdAt || "",
    updatedAt: report.updatedAt || "",
  };
}

export async function createReport(payload) {
  const response = await apiClient.post("/reports", {
    userId: payload.userId,
    userRole: "student",
    type: payload.type,
    targetId: payload.targetId || "",
    description: payload.description,
    status: "open",
  });

  return normalizeReport(response.data.data);
}

export async function fetchStudentReports(studentId) {
  const response = await apiClient.get(`/reports/student/${studentId}`);
  return (response.data.data || []).map(normalizeReport);
}
