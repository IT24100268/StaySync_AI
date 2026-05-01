const { StatusCodes } = require("http-status-codes");
const catchAsync = require("../../utils/catchAsync");
const { successResponse } = require("../../utils/apiResponse");
const {
  createStudentReport,
  listStudentReports,
  listAllReports,
  getReportById,
  updateReportById,
  getReportLogs,
} = require("../../services/shared/reportService");

const createReport = catchAsync(async (req, res) => {
  const report = await createStudentReport(req.user, req.body);
  return successResponse(res, {
    statusCode: StatusCodes.CREATED,
    message: "Report submitted successfully.",
    data: report,
  });
});

const getStudentReports = catchAsync(async (req, res) => {
  const reports = await listStudentReports(req.params.studentId, req.user);
  return successResponse(res, {
    statusCode: StatusCodes.OK,
    message: "Student reports fetched successfully.",
    data: reports,
  });
});

const getAllReports = catchAsync(async (req, res) => {
  const reports = await listAllReports();
  return successResponse(res, {
    statusCode: StatusCodes.OK,
    message: "All reports fetched successfully.",
    data: reports,
  });
});

const getReportDetails = catchAsync(async (req, res) => {
  const result = await getReportById(req.params.reportId);
  return successResponse(res, {
    statusCode: StatusCodes.OK,
    message: "Report details fetched successfully.",
    data: result,
  });
});

const updateReport = catchAsync(async (req, res) => {
  const result = await updateReportById(req.params.reportId, req.body);
  return successResponse(res, {
    statusCode: StatusCodes.OK,
    message: "Report updated successfully.",
    data: result,
  });
});

const getTargetLogs = catchAsync(async (req, res) => {
  const result = await getReportLogs(req.params.targetId);
  return successResponse(res, {
    statusCode: StatusCodes.OK,
    message: "Report logs fetched successfully.",
    data: result,
  });
});

module.exports = {
  createReport,
  getStudentReports,
  getAllReports,
  getReportDetails,
  updateReport,
  getTargetLogs,
};
