/**
 * @jest-environment node
 */
import "dotenv/config";
import { getServerSession } from "next-auth";
import nodemailer from "nodemailer";
import { NextRequest } from "next/server";

// Mock next-auth
jest.mock("next-auth");

// Mock nodemailer
jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue(true),
  })),
}));

// Mock Prisma client
const prismaClientMock = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  oTP: {
    create: jest.fn(),
    updateMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};

jest.mock("@/lib/database", () => ({
  prisma: prismaClientMock,
}));

import { GET, POST } from "../route";

describe("Email Verification API", () => {
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe("GET /api/verify-email", () => {
    it("should return 401 when no session exists", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({
        message: "User is not authenticated or email is missing",
      });
    });

    it("should return 404 when user not found", async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: "test@example.com" },
      });
      prismaClientMock.user.findUnique.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ message: "Usuario no encontrado" });
    });

    it("should return verified true if user is already verified", async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: "test@example.com" },
      });
      prismaClientMock.user.findUnique.mockResolvedValue({
        id: "1",
        email: "test@example.com",
        isVerified: true,
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ verified: true });
    });

    it("should return 429 if requesting OTP before 5 minutes", async () => {
      const mockUser = {
        id: "1",
        email: "test@example.com",
        username: "testuser",
        isVerified: false,
      };

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: mockUser.email },
      });
      prismaClientMock.user.findUnique.mockResolvedValue(mockUser);
      prismaClientMock.oTP.findFirst.mockResolvedValue({
        createdAt: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
        isUsed: false,
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data).toEqual({
        message: "Please wait 5 minutes before requesting a new OTP",
      });
    });

    it("should generate new OTP and send email for unverified user", async () => {
      const mockUser = {
        id: "1",
        email: "test@example.com",
        username: "testuser",
        isVerified: false,
      };

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: mockUser.email },
      });
      prismaClientMock.user.findUnique.mockResolvedValue(mockUser);
      prismaClientMock.oTP.findFirst.mockResolvedValue(null);
      prismaClientMock.oTP.create.mockResolvedValue({
        id: "1",
        code: "123456",
        email: mockUser.email,
        isUsed: false,
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.verified).toBe(false);
      expect(data.otp).toBeDefined();
      expect(prismaClientMock.oTP.updateMany).toHaveBeenCalled();
      expect(prismaClientMock.oTP.create).toHaveBeenCalled();
      expect(nodemailer.createTransport).toHaveBeenCalled();
    });

    it("should handle email sending error", async () => {
      const mockUser = {
        id: "1",
        email: "test@example.com",
        username: "testuser",
        isVerified: false,
      };

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: mockUser.email },
      });
      prismaClientMock.user.findUnique.mockResolvedValue(mockUser);
      prismaClientMock.oTP.findFirst.mockResolvedValue(null);
      const mockTransporter = {
        sendMail: jest
          .fn()
          .mockRejectedValue(new Error("Email sending failed")),
      };
      (nodemailer.createTransport as jest.Mock).mockReturnValue(
        mockTransporter,
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ message: "Error sending email" });
    });
  });

  describe("POST /api/verify-email", () => {
    const mockRequest = (body: {
      email: string;
      otpCode: string;
    }): NextRequest => {
      return {
        json: () => Promise.resolve(body),
      } as NextRequest;
    };

    it("should return 400 if email or OTP is missing", async () => {
      const response = await POST(
        mockRequest({ email: "test@example.com", otpCode: "" }),
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ message: "Email and OTP code are required" });
    });

    it("should return 400 for invalid OTP", async () => {
      prismaClientMock.oTP.findFirst.mockResolvedValue(null);

      const response = await POST(
        mockRequest({
          email: "test@example.com",
          otpCode: "123456",
        }),
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ message: "Invalid OTP or user not found" });
    });

    it("should verify email successfully with valid OTP", async () => {
      const testEmail = "test@example.com";
      const testOtpCode = "123456";

      const mockOTP = {
        id: "1",
        code: testOtpCode,
        email: testEmail,
        isUsed: false,
        expiresAt: new Date(Date.now() + 3600000),
      };

      prismaClientMock.oTP.findFirst.mockResolvedValue(mockOTP);
      prismaClientMock.$transaction.mockResolvedValue([
        { id: "1", isUsed: true },
        { email: testEmail, isVerified: true },
      ]);

      const response = await POST(
        mockRequest({
          email: testEmail,
          otpCode: testOtpCode,
        }),
      );
      const data = await response.json();

      expect(prismaClientMock.oTP.findFirst).toHaveBeenCalledWith({
        where: {
          email: testEmail,
          isUsed: false,
          expiresAt: expect.any(Object),
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Actualizada la expectativa de la transacción
      expect(prismaClientMock.$transaction).toHaveBeenCalledWith([
        prismaClientMock.oTP.update({
          where: { id: mockOTP.id },
          data: { isUsed: true },
        }),
        prismaClientMock.user.update({
          where: { email: testEmail },
          data: { isVerified: true },
        }),
      ]);

      expect(response.status).toBe(200);
      expect(data).toEqual({ message: "Email verified successfully" });
    });

    it("should handle database errors during verification", async () => {
      prismaClientMock.oTP.findFirst.mockRejectedValue(new Error("DB Error"));

      const response = await POST(
        mockRequest({
          email: "test@example.com",
          otpCode: "123456",
        }),
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ message: "Internal Server Error" });
      expect(console.error).toHaveBeenCalled();
    });
  });
});
