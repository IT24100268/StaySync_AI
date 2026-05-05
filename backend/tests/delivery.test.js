jest.mock("../src/middlewares/auth", () => (req, res, next) => {
  req.user = { _id: "delivery-user-1", role: "delivery", status: "active" };
  next();
});

jest.mock("../src/services/delivery/deliveryService", () => ({
  getDeliveryProfile: jest.fn(),
  updateDeliveryProfile: jest.fn(),
  listAvailableDeliveries: jest.fn(),
  acceptDelivery: jest.fn(),
  updateDeliveryStatus: jest.fn(),
  updateLiveLocation: jest.fn(),
  listAssignedDeliveries: jest.fn(),
}));

const request = require("supertest");
const app = require("../src/app");
const deliveryService = require("../src/services/delivery/deliveryService");

describe("Delivery APIs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("accepts a delivery job successfully", async () => {
    deliveryService.acceptDelivery.mockResolvedValue({ id: "delivery-1", status: "accepted" });

    const response = await request(app).patch("/api/delivery/jobs/6817d6a8d33b2a0012349991/accept");

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it("updates delivery status successfully", async () => {
    deliveryService.updateDeliveryStatus.mockResolvedValue({ id: "delivery-1", status: "in_transit" });

    const response = await request(app)
      .patch("/api/delivery/jobs/6817d6a8d33b2a0012349991/status")
      .send({ status: "in_transit" });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it("rejects live location update with invalid coordinates", async () => {
    const response = await request(app)
      .post("/api/delivery/jobs/6817d6a8d33b2a0012349991/location")
      .send({
        coordinates: {
          latitude: 120,
          longitude: 300,
        },
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Validation failed.");
  });

  it("shares live location successfully", async () => {
    deliveryService.updateLiveLocation.mockResolvedValue({
      id: "location-1",
      coordinates: { latitude: 43.6655, longitude: -79.3948 },
    });

    const response = await request(app)
      .post("/api/delivery/jobs/6817d6a8d33b2a0012349991/location")
      .send({
        coordinates: {
          latitude: 43.6655,
          longitude: -79.3948,
        },
        heading: 125,
        speed: 12.4,
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
  });
});
