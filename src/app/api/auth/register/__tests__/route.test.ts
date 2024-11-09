/**
 * @jest-environment node
 */
import "dotenv/config";

import { NextRequest } from "next/server";
import nodemailer from "nodemailer";

const prismaClientMock = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => prismaClientMock),
}));

jest.mock("bcrypt", () => ({
  hash: jest.fn(() => Promise.resolve("hashedPassword123")),
}));

// Mock Nodemailer para simular el envio de correos
jest.mock("nodemailer", () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue("Email sent successfully"), // Simula el envio del correo
  }),
}));

import { POST } from "../route";

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3001";

  it("should successfully create a new user", async () => {
    const userData = {
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    };

    prismaClientMock.user.findUnique.mockResolvedValueOnce(null);
    prismaClientMock.user.create.mockResolvedValueOnce({ id: 1, ...userData });

    const req = new Request(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    }) as unknown as NextRequest;

    const response = await POST(req);
    const data = await response.json();

    // Verifica que se haya creado el usuario correctamente
    expect(response.status).toBe(201);
    expect(data).toEqual({ message: "Created, welcome :)" });

    // Verifica que se haya llamado a la función sendMail para enviar el correo
    const transport = nodemailer.createTransport(); // Obtiene la instancia mockeada
    expect(transport.sendMail).toHaveBeenCalledTimes(1); // llamada exactamente una vez
    expect(transport.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "nexttaskmanager@gmail.com",
        to: userData.email,
        subject: "Confirmación de Registro",
      }),
    );
  });

  it("should return 400 if required fields are missing", async () => {
    const userData = {
      username: "testuser",
      password: "password123",
    };

    const req = new Request(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    }) as unknown as NextRequest;

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ message: "Invalid parameters" });
    expect(prismaClientMock.user.findUnique).not.toHaveBeenCalled();
    expect(prismaClientMock.user.create).not.toHaveBeenCalled();
    expect(nodemailer.createTransport().sendMail).not.toHaveBeenCalled();
  });

  it("should return 400 if user already exists", async () => {
    const userData = {
      username: "existinguser",
      email: "existing@example.com",
      password: "password123",
    };

    prismaClientMock.user.findUnique.mockResolvedValueOnce({
      id: 1,
      ...userData,
    });

    const req = new Request(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    }) as unknown as NextRequest;

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ message: "User already exists" });
    expect(prismaClientMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: userData.email },
    });
    expect(prismaClientMock.user.create).not.toHaveBeenCalled();
    expect(nodemailer.createTransport().sendMail).not.toHaveBeenCalled();
  });

  it("should return 500 on internal server error", async () => {
    const userData = {
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    };

    prismaClientMock.user.findUnique.mockRejectedValueOnce(
      new Error("Database error"),
    );

    const req = new Request(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    }) as unknown as NextRequest;

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ message: "Internal Server Error" });
    expect(prismaClientMock.user.findUnique).toHaveBeenCalled();
    expect(nodemailer.createTransport().sendMail).not.toHaveBeenCalled();
  });
});
