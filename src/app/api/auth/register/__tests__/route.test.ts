/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/database";
import { POST } from "../route";
import bcrypt from "bcrypt";

// Mock dependencies
jest.mock("@/lib/database", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock("bcrypt", () => ({
  hash: jest.fn(),
}));

describe("POST /api/register", () => {
  const mockRequest = (body: unknown) =>
    new NextRequest(new Request("http://localhost:3001"), {
      method: "POST",
      body: JSON.stringify(body),
    });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: Parámetros inválidos
  test("debería retornar 400 si faltan parámetros obligatorios", async () => {
    const response = await POST(
      mockRequest({
        name: "John Doe",
        email: "john@example.com",
        username: "john_doe",
        // Sin password
      }),
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toBe("Parametros inválidos");
  });

  // Test 2: Email ya registrado
  test("debería retornar 400 si el email ya está registrado", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "1",
      email: "john@example.com",
      username: "john_doe",
    });

    const response = await POST(
      mockRequest({
        name: "John Doe",
        email: "john@example.com",
        username: "john_doe",
        password: "password123",
      }),
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toBe("El email ya existe");
  });

  // Test 3: Username ya registrado
  test("debería retornar 400 si el username ya está registrado", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "1",
      email: "john@example.com",
      username: "john_doe",
    });

    const response = await POST(
      mockRequest({
        name: "John Doe",
        email: "john@example.com",
        username: "john_doe",
        password: "password123",
      }),
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toBe("El username ya existe");
  });

  // Test 4: Registro exitoso
  test("debería registrar un usuario correctamente", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword");

    const response = await POST(
      mockRequest({
        name: "John Doe",
        email: "john@example.com",
        username: "john_doe",
        password: "password123",
      }),
    );

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.message).toBe("Created, welcome :)");
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        name: "John Doe",
        email: "john@example.com",
        username: "john_doe",
        password: "hashedPassword",
      },
    });
  });

  // Test 5: Error interno del servidor
  test("debería manejar errores internos correctamente", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
    (bcrypt.hash as jest.Mock).mockRejectedValue(new Error("Hashing error"));

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    const response = await POST(
      mockRequest({
        name: "John Doe",
        email: "john@example.com",
        username: "john_doe",
        password: "password123",
      }),
    );

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.message).toBe("Error interno del servidor");

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error creating user:",
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
  });
});
