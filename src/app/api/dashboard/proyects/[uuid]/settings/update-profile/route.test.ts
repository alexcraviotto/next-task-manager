/**
 * @jest-environment node
 */
import "dotenv/config";
import { NextRequest } from "next/server";
import { hash } from "bcrypt";
import { getServerSession } from "next-auth";

// Mock de Prisma
const prismaClientMock = {
  user: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};

// Configuración de mocks
jest.mock("@/lib/database", () => ({
  prisma: prismaClientMock,
}));

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("bcrypt", () => ({
  hash: jest.fn().mockImplementation((str) => Promise.resolve(`hashed_${str}`)),
}));

// Mock de console.error para evitar ruido en los tests
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

import { PATCH } from "./route";

describe("PATCH /api/profile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Configurar un usuario autenticado por defecto
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "test@example.com", id: 1 },
    });
  });

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3001";

  /**
   * PRUEBA 1: Validación de datos (400)
   */
  it("should return 400 if username is too short", async () => {
    const userData = {
      username: "ab", // Menos de 3 caracteres
      email: "test@example.com",
      password: "password123",
    };

    const req = new Request(`${baseUrl}/api/profile`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    }) as unknown as NextRequest;

    const response = await PATCH(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errors).toContain(
      "Username must be at least 3 characters long",
    );
  });

  it("should return 400 if email format is invalid", async () => {
    const userData = {
      username: "validuser",
      email: "invalid-email",
      password: "password123",
    };

    const req = new Request(`${baseUrl}/api/profile`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    }) as unknown as NextRequest;

    const response = await PATCH(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errors).toContain("Invalid email format");
  });

  it("should return 400 if username is already taken", async () => {
    const userData = {
      username: "existinguser",
      email: "test@example.com",
      password: "password123",
    };

    prismaClientMock.user.findFirst
      .mockResolvedValueOnce({ id: 2 }) // Username existe
      .mockResolvedValueOnce(null); // Email no existe

    const req = new Request(`${baseUrl}/api/profile`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    }) as unknown as NextRequest;

    const response = await PATCH(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errors).toContain("Username already taken");
  });

  /**
   * PRUEBA 2: Autenticación (401)
   */
  it("should return 401 when not authenticated", async () => {
    // Simular usuario no autenticado
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const userData = {
      username: "validuser",
      email: "test@example.com",
      password: "password123",
    };

    const req = new Request(`${baseUrl}/api/profile`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    }) as unknown as NextRequest;

    const response = await PATCH(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: "Unauthorized" });
  });

  /**
   * PRUEBA 3: Actualización exitosa (200)
   */
  it("should successfully update user profile", async () => {
    const userData = {
      username: "newusername",
      email: "new@example.com",
      password: "newpassword123",
    };

    // Mock que username y email no existen
    prismaClientMock.user.findFirst
      .mockResolvedValueOnce(null) // Username no existe
      .mockResolvedValueOnce(null); // Email no existe

    // Mock actualización exitosa
    prismaClientMock.user.update.mockResolvedValueOnce({
      username: userData.username,
      email: userData.email,
      updatedAt: new Date(),
    });

    const req = new Request(`${baseUrl}/api/profile`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    }) as unknown as NextRequest;

    const response = await PATCH(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      message: "Profile updated successfully",
      user: {
        username: userData.username,
        email: userData.email,
      },
    });

    // Verificar que se llamó a hash para la contraseña
    expect(hash).toHaveBeenCalledWith(userData.password, 12);

    // Verificar la llamada a update
    expect(prismaClientMock.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        username: userData.username,
        email: userData.email,
        password: expect.any(String),
      },
      select: {
        username: true,
        email: true,
        updatedAt: true,
      },
    });
  });

  /**
   * PRUEBA 4: Error interno (500)
   */
  it("should return 500 on database error", async () => {
    const userData = {
      username: "validuser",
      email: "valid@example.com",
      password: "password123",
    };

    // Mock que la validación pasa
    prismaClientMock.user.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    // Mock error en la actualización
    prismaClientMock.user.update.mockRejectedValueOnce(
      new Error("Database error"),
    );

    const req = new Request(`${baseUrl}/api/profile`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    }) as unknown as NextRequest;

    const response = await PATCH(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "Internal server error" });
  });
});
