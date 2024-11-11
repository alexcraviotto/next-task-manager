/**
 * @jest-environment node
 */
import "dotenv/config";

// Definir prismaClientMock antes de los mocks
const prismaClientMock = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  oTP: {
    create: jest.fn(),
  },
};

// Mock de @prisma/client
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => prismaClientMock),
}));

// Mock de bcrypt y nodemailer
jest.mock("bcrypt", () => ({
  hash: jest.fn(() => Promise.resolve("hashedPassword123")),
}));

// Mock Nodemailer
jest.mock("nodemailer", () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue("Email sent successfully"),
  }),
}));

import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

// Mock de getServerSession
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

import { GET, POST } from "../route";

// Tests para el controlador GET
describe("GET /api/auth/verify-email", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return OTP code successfully if user is authenticated and OTP is valid but not verified", async () => {
    const userEmail = "test@example.com";
    const mockOtpCode = "123456";

    // Mock authenticated session
    const mockSession = {
      user: { email: userEmail },
    };
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

    // Mock valid user and OTP, but user is not verified
    prismaClientMock.user.findUnique.mockResolvedValueOnce({
      id: 1,
      email: userEmail,
      isVerified: false,
      otps: [
        {
          code: mockOtpCode,
          email: userEmail,
          isUsed: false,
          expiresAt: new Date("2025-02-01T00:00:00Z"),
          userId: 1,
        },
      ],
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ otp: mockOtpCode, verified: false });

    const expectedCall = {
      where: { email: userEmail },
      include: {
        otps: {
          where: {
            isUsed: false,
            expiresAt: { gt: expect.any(Date) },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    };

    expect(prismaClientMock.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining(expectedCall),
    );
  });

  it("should return 404 if user is not found", async () => {
    const userEmail = "test@example.com";

    // Mock authenticated session
    const mockSession = {
      user: { email: userEmail },
    };
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

    // Mock user not found
    prismaClientMock.user.findUnique.mockResolvedValueOnce(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ message: "User not found" });
  });

  it("should return 500 if there's an internal server error", async () => {
    const userEmail = "test@example.com";

    // Mock authenticated session
    const mockSession = {
      user: { email: userEmail },
    };
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

    // Mock database error
    prismaClientMock.user.findUnique.mockRejectedValueOnce(
      new Error("Database error"),
    );

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ message: "Internal Server Error" });
  });

  it("should return 401 if user is not authenticated", async () => {
    // Mock unauthenticated session
    (getServerSession as jest.Mock).mockResolvedValueOnce(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({
      message: "User is not authenticated or email is missing",
    });
  });
});

// Tests para el controlador POST
describe("POST /api/auth/verify-email", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should verify email successfully with correct OTP", async () => {
    const userEmail = "test@example.com";
    const otpCode = "123456";

    const req = {
      json: jest.fn().mockResolvedValueOnce({ email: userEmail, otpCode }),
    } as unknown as NextRequest;

    // Mock valid user and OTP
    prismaClientMock.user.findUnique.mockResolvedValueOnce({
      id: 1,
      email: userEmail,
      otps: [
        {
          code: otpCode,
          isUsed: false,
          expiresAt: new Date("2025-02-01T00:00:00Z"),
        },
      ],
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ message: "Email verified successfully" });

    // Check that user verification update was called
    expect(prismaClientMock.user.update).toHaveBeenCalledWith({
      where: { email: userEmail },
      data: { isVerified: true },
    });
  });

  it("should return 400 if OTP is invalid or user not found", async () => {
    const userEmail = "test@example.com";
    const otpCode = "123456";

    const req = {
      json: jest.fn().mockResolvedValueOnce({ email: userEmail, otpCode }),
    } as unknown as NextRequest;

    // Mock user not found or invalid OTP
    prismaClientMock.user.findUnique.mockResolvedValueOnce({
      id: 1,
      email: userEmail,
      otps: [],
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ message: "Invalid OTP or user not found" });
  });

  it("should return 400 if email or OTP code is missing", async () => {
    const req = {
      json: jest.fn().mockResolvedValueOnce({ email: null, otpCode: null }),
    } as unknown as NextRequest;

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ message: "Email and OTP code are required" });
  });

  it("should return 500 if there's an internal server error", async () => {
    const userEmail = "test@example.com";
    const otpCode = "123456";

    const req = {
      json: jest.fn().mockResolvedValueOnce({ email: userEmail, otpCode }),
    } as unknown as NextRequest;

    // Mock database error
    prismaClientMock.user.findUnique.mockRejectedValueOnce(
      new Error("Database error"),
    );

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ message: "Internal Server Error" });
  });
});
