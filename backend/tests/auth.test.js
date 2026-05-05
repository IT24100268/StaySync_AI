jest.mock("../src/services/auth/authService", () => ({
  sendRegistrationOtp: jest.fn(),
  verifyRegistrationOtp: jest.fn(),
  requestPasswordResetOtp: jest.fn(),
  registerUser: jest.fn(),
  loginUser: jest.fn(),
  resetPasswordWithOtp: jest.fn(),
}));

const request = require("supertest");
const app = require("../src/app");
const authService = require("../src/services/auth/authService");

describe("Auth and OTP APIs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("sends registration OTP successfully", async () => {
    authService.sendRegistrationOtp.mockResolvedValue({
      email: "student@example.com",
      expiresAt: "2026-05-05T12:00:00.000Z",
      verified: false,
    });

    const response = await request(app).post("/api/auth/send-otp").send({
      email: "student@example.com",
      name: "Student One",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(authService.sendRegistrationOtp).toHaveBeenCalledWith({
      email: "student@example.com",
      name: "Student One",
    });
  });

  it("rejects OTP verification with invalid code format", async () => {
    const response = await request(app).post("/api/auth/verify-otp").send({
      email: "student@example.com",
      otp: "12345",
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Validation failed.");
  });

  it("registers a verified user successfully", async () => {
    authService.registerUser.mockResolvedValue({
      token: "token-123",
      user: {
        id: "user-1",
        name: "Student One",
        email: "student@example.com",
        role: "student",
      },
    });

    const response = await request(app).post("/api/auth/register").send({
      role: "student",
      name: "Student One",
      email: "student@example.com",
      password: "Student@123",
      phone: "1234567890",
    });

    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBe("token-123");
  });

  it("blocks registration when OTP verification is missing", async () => {
    authService.registerUser.mockRejectedValue({
      statusCode: 403,
      message: "Please verify your email with OTP before registering.",
    });

    const response = await request(app).post("/api/auth/register").send({
      role: "student",
      name: "Student One",
      email: "student@example.com",
      password: "Student@123",
      phone: "1234567890",
    });

    expect(response.statusCode).toBe(403);
    expect(response.body.message).toBe("Please verify your email with OTP before registering.");
  });

  it("logs in successfully with valid credentials", async () => {
    authService.loginUser.mockResolvedValue({
      token: "token-123",
      user: {
        id: "user-1",
        name: "Student One",
        email: "student@example.com",
        role: "student",
      },
    });

    const response = await request(app).post("/api/auth/login").send({
      email: "student@example.com",
      password: "Student@123",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe("student@example.com");
  });

  it("fails login validation when email and password are missing", async () => {
    const response = await request(app).post("/api/auth/login").send({});

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Validation failed.");
  });
});
