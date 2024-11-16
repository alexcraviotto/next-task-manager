/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/database";
import { hash } from "bcrypt";
import { PATCH } from "../route";

// Mock dependencies
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("bcrypt", () => ({
  hash: jest.fn(),
}));

jest.mock("@/lib/database", () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe("PATCH update profile endpoint", () => {
  const mockSession = {
    user: {
      id: "1",
      email: "test@example.com",
    },
  };

  const mockRequest = (body: unknown) =>
    new NextRequest(new Request("http://localhost:3001"), {
      method: "PATCH",
      body: JSON.stringify(body),
    });

  beforeEach(() => {
    jest.clearAllMocks();
    (hash as jest.Mock).mockResolvedValue("hashed_password");
  });

  // Test 1: Usuario no autenticado
  test("debería retornar 401 si el usuario no está autenticado", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const response = await PATCH(
      mockRequest({
        username: "newusername",
        email: "new@example.com",
        password: "newpassword123",
      }),
    );

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data).toEqual({ error: "Unauthorized" });
  });

  // Test 2: Actualización exitosa de todos los campos
  test("debería actualizar el perfil correctamente con todos los campos", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.user.findFirst as jest.Mock)
      .mockResolvedValueOnce(null) // username check
      .mockResolvedValueOnce(null); // email check

    const updatedUser = {
      username: "newusername",
      email: "new@example.com",
    };

    (prisma.user.update as jest.Mock).mockResolvedValue(updatedUser);

    const response = await PATCH(
      mockRequest({
        username: "newusername",
        email: "new@example.com",
        password: "newpassword123",
      }),
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(hash).toHaveBeenCalledWith("newpassword123", 12);
    expect(data.message).toBe("Profile updated successfully");
    expect(data.user).toEqual(updatedUser);
  });

  // Test 3: Nombre de usuario duplicado
  test("debería retornar error si el username ya existe", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.user.findFirst as jest.Mock)
      .mockResolvedValueOnce({ id: 2 }) // username exists
      .mockResolvedValueOnce(null); // email check

    const response = await PATCH(
      mockRequest({
        username: "existinguser",
        email: "new@example.com",
        password: "newpassword123",
      }),
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.errors).toContain("Username already taken");
  });

  // Test 4: Email duplicado
  test("debería retornar error si el email ya existe", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.user.findFirst as jest.Mock)
      .mockResolvedValueOnce(null) // username check
      .mockResolvedValueOnce({ id: 2 }); // email exists

    const response = await PATCH(
      mockRequest({
        username: "newusername",
        email: "existing@example.com",
        password: "newpassword123",
      }),
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.errors).toContain("Email already in use");
  });

  // Test 5: Validación de formato de datos
  test("debería validar el formato de los datos", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);

    const response = await PATCH(
      mockRequest({
        username: "ab", // muy corto
        email: "invalid-email", // formato inválido
        password: "123", // muy corta
      }),
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.errors).toContain(
      "Username must be at least 3 characters long",
    );
    expect(data.errors).toContain("Invalid email format");
    expect(data.errors).toContain(
      "Password must be at least 8 characters long",
    );
  });

  // Test 6: Error en la base de datos durante la validación
  test("debería manejar errores de base de datos durante la validación", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.user.findFirst as jest.Mock).mockRejectedValue(
      new Error("Database error"),
    );

    const response = await PATCH(
      mockRequest({
        username: "newusername",
        email: "new@example.com",
        password: "newpassword123",
      }),
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.errors[0]).toContain(
      "Error checking username and email availability",
    );
  });

  // Test 7: Error interno del servidor durante la actualización
  test("debería manejar errores internos durante la actualización", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.user.findFirst as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    (prisma.user.update as jest.Mock).mockRejectedValue(
      new Error("Database error"),
    );

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    const response = await PATCH(
      mockRequest({
        username: "newusername",
        email: "new@example.com",
        password: "newpassword123",
      }),
    );

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toEqual({ error: "Internal server error" });

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  // Test 8: Actualización parcial (solo algunos campos)
  test("debería permitir actualizar solo algunos campos", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.user.findFirst as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    const updatedUser = {
      username: "newusername",
      email: "test@example.com", // email sin cambios
    };

    (prisma.user.update as jest.Mock).mockResolvedValue(updatedUser);

    const response = await PATCH(
      mockRequest({
        username: "newusername",
        email: "test@example.com",
        password: "", // sin cambio de contraseña
      }),
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.user).toEqual(updatedUser);
    expect(hash).not.toHaveBeenCalled(); // No se debe llamar a hash si no hay nueva contraseña
  });
});
