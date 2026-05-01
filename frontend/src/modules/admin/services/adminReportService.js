import apiClient from "../../../services/apiClient";
import { updateAdminUserBlockStatus } from "./adminUserService";

function normalizeReportStatus(status) {
  switch (status) {
    case "in_review":
      return "In Review";
    case "resolved":
      return "Resolved";
    case "rejected":
      return "Rejected";
    case "open":
    default:
      return "Open";
  }
}

function normalizeTargetType(targetType, reportType) {
  if (targetType) {
    if (targetType === "room") return "Room";
    if (targetType === "restaurant") return "Restaurant";
    if (targetType === "delivery") return "Delivery";
    if (targetType === "user") return "User";
    return "Other";
  }

  if (["Room Issue", "Fake Listing", "Price Issue"].includes(reportType)) {
    return "Room";
  }

  if (reportType === "Food / Delivery Issue") {
    return "Delivery";
  }

  return "Other";
}

function normalizeListReport(report) {
  const reportedByName = report.student?.user?.name || report.user?.name || "Student";

  return {
    id: report._id || report.id,
    type: report.type || "Complaint",
    title: `${report.type || "Complaint"} from ${reportedByName}`,
    status: normalizeReportStatus(report.status),
    description: report.description || "",
    shortDescription: String(report.description || "").slice(0, 88),
    createdAt: report.createdAt ? new Date(report.createdAt).toLocaleString() : "",
    createdDateLabel: report.createdAt ? new Date(report.createdAt).toLocaleDateString() : "",
    targetId: report.targetId || "",
    targetType: normalizeTargetType(report.targetType, report.type),
    actionTaken: report.actionTaken || "",
    reportedBy: {
      id: report.user?._id || report.userId || report.user || "",
      name: reportedByName,
      email: report.student?.user?.email || report.user?.email || "",
      role: report.student?.user?.role || report.user?.role || "student",
    },
  };
}

function normalizeReportDetails(payload) {
  const report = payload.report || payload;
  const target = payload.target || null;
  const normalized = normalizeListReport(report);

  return {
    ...normalized,
    statusRaw: report.status || "open",
    target: target
      ? {
          id: target._id || target.id,
          title: target.title || target.name || target.hostelName || "Target",
          status:
            typeof target.isAvailable === "boolean"
              ? target.isAvailable
                ? "Active"
                : "Inactive"
              : target.status || "",
          ownerName: target.owner?.user?.name || "",
        }
      : null,
  };
}

function normalizeLogPayload(payload) {
  return {
    previousComplaintsCount: Number(payload.previousComplaintsCount || 0),
    recentActivityLogs: (payload.recentActivityLogs || []).map((item) => ({
      id: item.id,
      message: item.message || "",
      createdAt: item.createdAt ? new Date(item.createdAt).toLocaleString() : "",
    })),
  };
}

export async function fetchReportsAndLogs() {
  const response = await apiClient.get("/reports");

  return {
    reports: (response.data.data || []).map(normalizeListReport),
    logs: [],
  };
}

export async function fetchAdminReportById(reportId) {
  const response = await apiClient.get(`/reports/${reportId}`);
  return normalizeReportDetails(response.data.data);
}

export async function fetchAdminReportLogs(targetId) {
  if (!targetId) {
    return {
      previousComplaintsCount: 0,
      recentActivityLogs: [],
    };
  }

  const response = await apiClient.get(`/reports/logs/${targetId}`);
  return normalizeLogPayload(response.data.data);
}

export async function updateAdminReport(reportId, payload) {
  const response = await apiClient.put(`/reports/${reportId}`, payload);
  return normalizeReportDetails(response.data.data);
}

export async function markAdminReportResolved(reportId) {
  return updateAdminReport(reportId, {
    status: "resolved",
    actionTaken: "Issue handled",
  });
}

export async function rejectAdminComplaint(reportId) {
  return updateAdminReport(reportId, {
    status: "rejected",
    actionTaken: "Invalid complaint",
  });
}

export async function markAdminReportInReview(reportId, actionTaken = "Admin review started") {
  return updateAdminReport(reportId, {
    status: "in_review",
    actionTaken,
  });
}

export async function blockComplaintUser(userId, reason = "Blocked after complaint review.") {
  return updateAdminUserBlockStatus(userId, true, reason);
}

export async function removeComplaintListing(roomId) {
  const response = await apiClient.put(`/rooms/${roomId}/deactivate`);
  return response.data.data;
}
