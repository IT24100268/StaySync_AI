const { StatusCodes } = require("http-status-codes");
const { Report, REPORT_STATUSES, REPORT_TARGET_TYPES } = require("../../models/Report");
const ApiError = require("../../utils/apiError");
const { requireProfile } = require("./profileService");
const Room = require("../../models/Room");
const User = require("../../models/User");

function deriveTargetType(payload) {
  if (payload.targetType) {
    return payload.targetType;
  }

  if (["Room Issue", "Fake Listing", "Price Issue"].includes(payload.type)) {
    return REPORT_TARGET_TYPES.ROOM;
  }

  if (payload.type === "Food / Delivery Issue") {
    return REPORT_TARGET_TYPES.DELIVERY;
  }

  return REPORT_TARGET_TYPES.OTHER;
}

function buildActivityLogs(report, relatedReports = [], target = null) {
  const logs = relatedReports.slice(0, 5).map((item) => ({
    id: item._id.toString(),
    message: `${item.type} complaint was submitted with status ${item.status}.`,
    createdAt: item.createdAt,
  }));

  if (target && report.targetType === REPORT_TARGET_TYPES.ROOM) {
    logs.unshift({
      id: `target-${target._id}`,
      message: `Room listing is currently ${target.isAvailable ? "active" : "inactive"}.`,
      createdAt: target.updatedAt || target.createdAt || new Date(),
    });
  }

  return logs.slice(0, 5);
}

async function createStudentReport(user, payload) {
  if (String(user._id) !== String(payload.userId)) {
    throw new ApiError(StatusCodes.FORBIDDEN, "You can only create reports for your own account.");
  }

  const studentProfile = await requireProfile(user);

  const report = await Report.create({
    user: user._id,
    userId: user._id,
    student: studentProfile._id,
    userRole: payload.userRole,
    type: payload.type,
    targetId: payload.targetId || "",
    targetType: deriveTargetType(payload),
    description: payload.description,
    status: REPORT_STATUSES.OPEN,
    actionTaken: "",
  });

  return report;
}

async function listStudentReports(studentId, user) {
  const studentProfile = await requireProfile(user);

  const matchesProfileId = String(studentProfile._id) === String(studentId);
  const matchesUserId = String(user._id) === String(studentId);

  if (!matchesProfileId && !matchesUserId) {
    throw new ApiError(StatusCodes.FORBIDDEN, "You can only view your own reports.");
  }

  return Report.find({ student: studentProfile._id }).sort({ createdAt: -1 });
}

async function listAllReports() {
  return Report.find()
    .populate("user", "name email role")
    .populate({
      path: "student",
      populate: { path: "user", select: "name email role" },
    })
    .sort({ createdAt: -1 });
}

async function getReportById(reportId) {
  const report = await Report.findById(reportId)
    .populate("user", "name email role status")
    .populate({
      path: "student",
      populate: { path: "user", select: "name email role status" },
    });

  if (!report) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Report not found.");
  }

  let target = null;

  if (report.targetId && report.targetType === REPORT_TARGET_TYPES.ROOM) {
    target = await Room.findById(report.targetId)
      .populate({
        path: "owner",
        populate: { path: "user", select: "name email phone" },
      });
  }

  if (report.targetId && report.targetType === REPORT_TARGET_TYPES.USER) {
    target = await User.findById(report.targetId).select("name email role status");
  }

  return {
    report,
    target,
  };
}

async function updateReportById(reportId, payload) {
  const report = await Report.findById(reportId);

  if (!report) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Report not found.");
  }

  report.status = payload.status;
  report.actionTaken = payload.actionTaken || report.actionTaken || "";
  await report.save();

  return getReportById(reportId);
}

async function getReportLogs(targetId) {
  const relatedReports = await Report.find({ targetId }).sort({ createdAt: -1 });
  const latestReport = relatedReports[0] || null;

  let target = null;
  if (latestReport?.targetType === REPORT_TARGET_TYPES.ROOM) {
    target = await Room.findById(targetId);
  }

  return {
    previousComplaintsCount: Math.max(relatedReports.length - 1, 0),
    recentActivityLogs: latestReport ? buildActivityLogs(latestReport, relatedReports, target) : [],
  };
}

module.exports = {
  createStudentReport,
  listStudentReports,
  listAllReports,
  getReportById,
  updateReportById,
  getReportLogs,
};
