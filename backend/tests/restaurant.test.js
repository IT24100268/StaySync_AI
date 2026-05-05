jest.mock("../src/middlewares/auth", () => (req, res, next) => {
  req.user = { _id: "restaurant-user-1", role: "restaurant", status: "active" };
  next();
});

jest.mock("../src/services/restaurant/restaurantService", () => ({
  getRestaurantProfile: jest.fn(),
  listPublicRestaurants: jest.fn(),
  getPublicRestaurantMenu: jest.fn(),
  getRestaurantReviews: jest.fn(),
  updateRestaurantProfile: jest.fn(),
  listFoodItems: jest.fn(),
  createFoodItem: jest.fn(),
  updateFoodItem: jest.fn(),
  deleteFoodItem: jest.fn(),
  listRestaurantOrders: jest.fn(),
  updateRestaurantOrderStatus: jest.fn(),
}));

const request = require("supertest");
const app = require("../src/app");
const restaurantService = require("../src/services/restaurant/restaurantService");

describe("Restaurant APIs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a food item successfully", async () => {
    restaurantService.createFoodItem.mockResolvedValue({
      id: "food-1",
      name: "Paneer Wrap",
      price: 180,
    });

    const response = await request(app).post("/api/restaurants/menu").send({
      name: "Paneer Wrap",
      description: "Fresh paneer wrap",
      category: "Wraps",
      price: 180,
    });

    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
  });

  it("rejects food item creation when name is missing", async () => {
    const response = await request(app).post("/api/restaurants/menu").send({
      description: "Fresh paneer wrap",
      category: "Wraps",
      price: 180,
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Validation failed.");
  });

  it("fetches restaurant orders successfully", async () => {
    restaurantService.listRestaurantOrders.mockResolvedValue([{ id: "order-1" }]);

    const response = await request(app).get("/api/restaurants/orders");

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it("updates restaurant order status successfully", async () => {
    restaurantService.updateRestaurantOrderStatus.mockResolvedValue({
      id: "order-1",
      status: "preparing",
    });

    const response = await request(app)
      .patch("/api/restaurants/orders/6817d6a8d33b2a0012349991/status")
      .send({ status: "preparing" });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it("requires rejection reason when cancelling an order", async () => {
    const response = await request(app)
      .patch("/api/restaurants/orders/6817d6a8d33b2a0012349991/status")
      .send({ status: "cancelled" });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Validation failed.");
  });
});
