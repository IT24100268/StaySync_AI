const express = require("express");
const auth = require("../../middlewares/auth");
const authorize = require("../../middlewares/authorize");
const validateRequest = require("../../middlewares/validateRequest");
const { ROLES } = require("../../constants/appConstants");
const {
  createReport,
  getStudentReports,
  getAllReports,
  getReportDetails,
  updateReport,
  getTargetLogs,
} = require("../../controllers/shared/reportController");
const {
  reportCreationValidator,
  reportStudentValidator,
  reportIdValidator,
  reportLogsValidator,
  reportUpdateValidator,
} = require("../../validators/sharedValidators");

const router = express.Router();

router.post("/", auth, authorize(ROLES.STUDENT), validateRequest(reportCreationValidator), createReport);
router.get("/", auth, authorize(ROLES.ADMIN), getAllReports);
router.get("/logs/:targetId", auth, authorize(ROLES.ADMIN), validateRequest(reportLogsValidator), getTargetLogs);
router.get(
  "/student/:studentId",
  auth,
  authorize(ROLES.STUDENT),
  validateRequest(reportStudentValidator),
  getStudentReports
);
router.get("/:reportId", auth, authorize(ROLES.ADMIN), validateRequest(reportIdValidator), getReportDetails);
router.put("/:reportId", auth, authorize(ROLES.ADMIN), validateRequest(reportUpdateValidator), updateReport);

module.exports = router;
