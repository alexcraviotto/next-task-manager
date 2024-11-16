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
  },
  $transaction: jest.fn(),
};

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => prismaClientMock),
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
      // Testing when otpCode is missing
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
    /*
    it("should verify email successfully with valid OTP", async () => {
      const testEmail = "test@example.com";
      const testOtpCode = "123456";
    
      // Crear un mock del OTP que coincida exactamente con lo que espera verificar
      const mockOTP = {
        id: "1",
        code: testOtpCode,
        email: testEmail,
        isUsed: false,
        expiresAt: new Date(Date.now() + 3600000)
      };
    
      // Mock de las operaciones individuales
      const mockOtpUpdate = {
        id: mockOTP.id,
        isUsed: true
      };
    
      const mockUserUpdate = {
        id: "1",
        email: testEmail,
        isVerified: true
      };
    
      // Configurar el mock para devolver el OTP cuando se busque
      prismaClientMock.oTP.findFirst.mockResolvedValue(mockOTP);
    
      // Mock de la transacción exitosa
      prismaClientMock.$transaction.mockResolvedValue([
        mockOtpUpdate,
        mockUserUpdate
      ]);
    
      // Crear la request con los mismos valores que coincidan con el mock
      const response = await POST(mockRequest({
        email: testEmail,
        otpCode: testOtpCode // Este código debe coincidir con mockOTP.code
      }));
    
      const data = await response.json();
    
      // Verificar que findFirst fue llamado con los parámetros correctos
      expect(prismaClientMock.oTP.findFirst).toHaveBeenCalledWith({
        where: {
          email: testEmail,
          isUsed: false,
          expiresAt: expect.any(Object)
        },
        orderBy: {
          createdAt: "desc"
        }
      });
    
      // Verificar que la transacción fue llamada
      expect(prismaClientMock.$transaction).toHaveBeenCalled();
      expect(prismaClientMock.$transaction).toHaveBeenCalledWith([
        expect.objectContaining({
          where: { id: mockOTP.id },
          data: { isUsed: true }
        }),
        expect.objectContaining({
          where: { email: testEmail },
          data: { isVerified: true }
        })
      ]);
    
      expect(response.status).toBe(200);
      expect(data).toEqual({ message: "Email verified successfully" });
    });    
    */
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

