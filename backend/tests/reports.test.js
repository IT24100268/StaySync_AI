jest.mock("../src/middlewares/auth", () => (req, res, next) => {
  req.user = { _id: "student-user-1", role: "student", status: "active" };
  next();
});

jest.mock("../src/services/shared/reportService", () => ({
  createStudentReport: jest.fn(),
  listStudentReports: jest.fn(),
  listAllReports: jest.fn(),
  getReportById: jest.fn(),
  updateReportById: jest.fn(),
  getReportLogs: jest.fn(),
}));

const request = require("supertest");
const app = require("../src/app");
const reportService = require("../src/services/shared/reportService");

describe("Report APIs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a student report successfully", async () => {
    reportService.createStudentReport.mockResolvedValue({ id: "report-1", type: "Food / Delivery Issue" });

    const response = await request(app).post("/api/reports").send({
      userId: "6817d6a8d33b2a0012349991",
      userRole: "student",
      type: "Food / Delivery Issue",
      targetId: "order-1",
      description: "Food arrived late and cold.",
    });

    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
  });

  it("rejects report creation with too-short description", async () => {
    const response = await request(app).post("/api/reports").send({
      userId: "6817d6a8d33b2a0012349991",
      userRole: "student",
      type: "Food / Delivery Issue",
      targetId: "order-1",
      description: "Too bad",
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Validation failed.");
  });
});
