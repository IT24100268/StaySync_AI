jest.mock("../src/middlewares/auth", () => (req, res, next) => {
  req.user = { _id: "student-user-1", role: "student", status: "active" };
  next();
});

jest.mock("../src/services/shared/orderService", () => ({
  createOrder: jest.fn(),
  estimateDeliveryFee: jest.fn(),
  listStudentOrders: jest.fn(),
  getOrderTracking: jest.fn(),
  markStudentOrderNotificationSeen: jest.fn(),
  updateOrderLifecycleStatus: jest.fn(),
}));

const request = require("supertest");
const app = require("../src/app");
const orderService = require("../src/services/shared/orderService");

describe("Student order APIs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a student food order successfully", async () => {
    orderService.createOrder.mockResolvedValue({
      order: { id: "order-1" },
      items: [],
    });

    const response = await request(app).post("/api/orders").send({
      restaurantId: "6817d5d8d33b2a0012345678",
      orderType: "delivery",
      deliveryAddress: "45 College Street, Toronto",
      deliveryLatitude: 43.6644,
      deliveryLongitude: -79.3987,
      items: [
        {
          foodItemId: "6817d6a8d33b2a0012349991",
          quantity: 2,
        },
      ],
    });

    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
    expect(orderService.createOrder).toHaveBeenCalled();
  });

  it("rejects order creation when items are missing", async () => {
    const response = await request(app).post("/api/orders").send({
      restaurantId: "6817d5d8d33b2a0012345678",
      orderType: "delivery",
      deliveryAddress: "45 College Street, Toronto",
      deliveryLatitude: 43.6644,
      deliveryLongitude: -79.3987,
      items: [],
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Validation failed.");
  });

  it("gets order tracking for the student", async () => {
    orderService.getOrderTracking.mockResolvedValue({
      order: { id: "order-1", status: "out_for_delivery" },
      items: [],
      liveLocation: null,
    });

    const response = await request(app).get("/api/orders/6817d6a8d33b2a0012349991/tracking");

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(orderService.getOrderTracking).toHaveBeenCalled();
  });
});
