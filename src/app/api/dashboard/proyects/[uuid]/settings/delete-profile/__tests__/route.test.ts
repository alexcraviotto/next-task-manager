/**
 * @jest-environment node
 */

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/database";
import { DELETE } from "../route";

// Mock dependencies
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/database", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe("DELETE deactivate account endpoint", () => {
  const mockSession = {
    user: {
      email: "test@example.com",
    },
  };

  const mockUser = {
    id: 1,
    email: "test@example.com",
    isActive: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: Usuario no autenticado
  test("debería retornar 401 si el usuario no está autenticado", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const response = await DELETE();

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data).toEqual({ error: "Unauthorized" });
  });

  // Test 2: Error en la base de datos durante la búsqueda
  test("debería manejar errores de base de datos durante la búsqueda del usuario", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.user.findUnique as jest.Mock).mockRejectedValue(
      new Error("Database error"),
    );

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    const response = await DELETE();

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toEqual({ error: "Failed to deactivate account" });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error deactivating account:",
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
  });

  // Test 3: Usuario no encontrado
  test("debería fallar si el usuario no existe", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await DELETE();

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toEqual({ error: "Failed to deactivate account" });
  });

  // Test 4: Error en la base de datos durante la actualización
  test("debería manejar errores de base de datos durante la actualización", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.user.update as jest.Mock).mockRejectedValue(
      new Error("Database error"),
    );

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    const response = await DELETE();

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toEqual({ error: "Failed to deactivate account" });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error deactivating account:",
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
  });

  // Test 5: Desactivación exitosa de la cuenta
  test("debería desactivar la cuenta correctamente", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.user.update as jest.Mock).mockResolvedValue({
      ...mockUser,
      isActive: false,
    });

    const response = await DELETE();

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ message: "Account deactivated successfully" });

    // Verificar que se llamó a update con los parámetros correctos
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: mockUser.id },
      data: { isActive: false },
    });
  });
});
