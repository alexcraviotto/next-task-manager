/**
 * @jest-environment node
 */
import "dotenv/config";
import { NextRequest } from "next/server";
import { hash } from "bcrypt";

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

jest.mock("bcrypt", () => ({
  hash: jest.fn().mockImplementation((str) => Promise.resolve(`hashed_${str}`)),
}));

import { PATCH } from "./route";

describe("PATCH /api/profile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3001";

  /**
   * PRUEBA 1: Validación de datos (400)
   * Corresponde a la primera validación en route.ts
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
      email: "invalid-email", // Email inválido
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
   * PRUEBA 2: Actualización exitosa (200)
   * Corresponde al caso de éxito en route.ts
   */
  it("should successfully update user profile (status 200)", async () => {
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
   * PRUEBA 3: Error interno (500)
   * Corresponde al bloque catch en route.ts
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
