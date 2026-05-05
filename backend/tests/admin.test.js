jest.mock("../src/middlewares/auth", () => (req, res, next) => {
  req.user = { _id: "admin-user-1", role: "admin", status: "active" };
  next();
});

jest.mock("../src/services/admin/adminService", () => ({
  getDashboardSummary: jest.fn(),
  moderateRoom: jest.fn(),
  moderateOwner: jest.fn(),
  listOwnersForModeration: jest.fn(),
  moderateRestaurant: jest.fn(),
  listRestaurantsForModeration: jest.fn(),
  moderateDeliveryPartner: jest.fn(),
  listDeliveryPartnersForModeration: jest.fn(),
  listUsers: jest.fn(),
  blockOrUnblockUser: jest.fn(),
  listOrders: jest.fn(),
  getOrderDetails: jest.fn(),
  listReports: jest.fn(),
  listAdminLogs: jest.fn(),
}));

const request = require("supertest");
const app = require("../src/app");
const adminService = require("../src/services/admin/adminService");

describe("Admin APIs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches admin dashboard summary successfully", async () => {
    adminService.getDashboardSummary.mockResolvedValue({ totalUsers: 10 });

    const response = await request(app).get("/api/admin/dashboard");

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it("blocks a user successfully", async () => {
    adminService.blockOrUnblockUser.mockResolvedValue({ id: "user-1", status: "blocked" });

    const response = await request(app)
      .patch("/api/admin/users/6817d6a8d33b2a0012349991/block")
      .send({
        isBlocked: true,
        reason: "Policy violation",
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it("rejects block user requests when isBlocked is not a boolean", async () => {
    const response = await request(app)
      .patch("/api/admin/users/6817d6a8d33b2a0012349991/block")
      .send({
        isBlocked: "yes",
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Validation failed.");
  });
});
