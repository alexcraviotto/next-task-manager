/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/database";
import { PATCH } from "../route";

// Mock dependencies
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/database", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    taskRating: {
      upsert: jest.fn(),
      findFirst: jest.fn(),
    },
    userOrganization: {
      findMany: jest.fn(),
    },
  },
}));

describe("PATCH task rating endpoint", () => {
  const mockUser = {
    id: "123",
    email: "test@example.com",
  };

  const mockRequest = (body: unknown) =>
    new NextRequest(new Request("http://localhost:3001"), {
      method: "PATCH",
      body: JSON.stringify(body),
    });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: Usuario no autenticado
  test("debería retornar 401 si el usuario no está autenticado", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const response = await PATCH(
      mockRequest({ organizationId: "1", effort: 3 }),
      { params: { id: "1" } },
    );

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data).toEqual({ error: "Unauthorized" });
  });

  // Test 2: Usuario no encontrado
  test("debería retornar 404 si el usuario no existe", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "test@example.com" },
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await PATCH(
      mockRequest({ organizationId: "1", effort: 3 }),
      { params: { id: "1" } },
    );

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data).toEqual({ error: "User not found" });
  });

  // Test 3: ID de tarea inválido
  test("debería retornar 400 si el ID de tarea es inválido", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "test@example.com" },
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    const response = await PATCH(
      mockRequest({ organizationId: "1", effort: 3 }),
      { params: { id: "invalid" } },
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toEqual({ error: "Invalid task ID" });
  });

  // Test 4: Datos de entrada inválidos
  test("debería retornar 400 si los datos de entrada son inválidos", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "test@example.com" },
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    const response = await PATCH(
      mockRequest({ organizationId: "1" }), // Sin effort ni clientWeight
      { params: { id: "1" } },
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe(
      "At least one field (effort or clientWeight) must be provided",
    );
  });

  // Test 5: Actualización exitosa de effort
  test("debería actualizar el effort correctamente", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "test@example.com" },
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    const mockUpdatedRating = {
      effort: 4,
      clientWeight: 0,
      clientSatisfaction: 0,
    };

    (prisma.taskRating.upsert as jest.Mock).mockResolvedValue(
      mockUpdatedRating,
    );

    const response = await PATCH(
      mockRequest({
        organizationId: "1",
        effort: 4,
      }),
      { params: { id: "1" } },
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.message).toBe("Task updated successfully");
    expect(data.rating).toEqual(mockUpdatedRating);
  });

  // Test 6: Actualización exitosa de clientWeight
  // Echar vistazo porque creo que no obtiene el peso de cada miembro en la tarea para recalcular el clientSatisfaction
  test("debería actualizar el clientWeight y recalcular satisfacción", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "test@example.com" },
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    const mockPreviousRating = {
      clientWeight: 3,
      clientSatisfaction: 9,
    };
    (prisma.taskRating.findFirst as jest.Mock).mockResolvedValue(
      mockPreviousRating,
    );

    const mockUserOrganizations = [{ weight: 1 }, { weight: 2 }]; // Peso de cada miembro en la tarea
    (prisma.userOrganization.findMany as jest.Mock).mockResolvedValue(
      mockUserOrganizations,
    );

    const mockUpdatedRating = {
      effort: 0,
      clientWeight: 4,
      clientSatisfaction: 12, // 1*4 + 2*4 = 12
    };
    (prisma.taskRating.upsert as jest.Mock).mockResolvedValue(
      mockUpdatedRating,
    );

    const response = await PATCH(
      mockRequest({
        organizationId: "1",
        clientWeight: 4,
      }),
      { params: { id: "1" } },
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.message).toBe("Task updated successfully");
    expect(data.rating).toEqual(mockUpdatedRating);
  });

  // Test 7: Error interno del servidor
  test("debería manejar errores internos correctamente", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "test@example.com" },
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.taskRating.upsert as jest.Mock).mockRejectedValue(
      new Error("Database error"),
    );

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    const response = await PATCH(
      mockRequest({
        organizationId: "1",
        effort: 4,
      }),
      { params: { id: "1" } },
    );

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toEqual({ error: "Internal server error" });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error updating task:",
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
  });

  // Test 8: Validación Zod
  test("debería manejar errores de validación Zod", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "test@example.com" },
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    const response = await PATCH(
      mockRequest({
        organizationId: "1",
        effort: 6, // Mayor que el máximo permitido (5)
      }),
      { params: { id: "1" } },
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid input data");
    expect(data.details).toBeDefined();
  });
});
