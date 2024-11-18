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
    userOrganization: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    taskRating: {
      update: jest.fn(),
    },
  },
}));

describe("PATCH update user weights endpoint", () => {
  const mockUser = {
    id: 1,
    email: "test@example.com",
    taskRatings: [
      {
        id: 1,
        taskId: 1,
        userId: 1,
        clientWeight: 1,
        clientSatisfaction: 1,
        task: {
          organizationId: "org123",
        },
      },
    ],
  };

  const mockUserOrg = {
    userId: 1,
    orgId: "org123",
    weight: 1,
  };

  const mockTaskRatingUpdate = {
    id: 1,
    taskId: 1,
    clientWeight: 1,
    clientSatisfaction: 3,
  };

  const mockUserOrgUpdate = {
    userId: 1,
    orgId: "org123",
    weight: 3,
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
      mockRequest({
        organizationId: "org123",
        newWeight: 3,
      }),
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
      mockRequest({
        organizationId: "org123",
        newWeight: 3,
      }),
    );

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data).toEqual({ error: "User not found" });
  });

  // Test 3: Usuario no pertenece a la organización
  test("debería retornar 404 si el usuario no pertenece a la organización", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "test@example.com" },
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.userOrganization.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await PATCH(
      mockRequest({
        organizationId: "org123",
        newWeight: 3,
      }),
    );

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data).toEqual({ error: "User not found in organization" });
  });

  // Test 4: Actualización exitosa
  test("debería actualizar los pesos y calificaciones correctamente", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "test@example.com" },
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.userOrganization.findUnique as jest.Mock).mockResolvedValue(
      mockUserOrg,
    );
    (prisma.taskRating.update as jest.Mock).mockResolvedValue(
      mockTaskRatingUpdate,
    );
    (prisma.userOrganization.update as jest.Mock).mockResolvedValue(
      mockUserOrgUpdate,
    );

    const response = await PATCH(
      mockRequest({
        organizationId: "org123",
        newWeight: 3,
      }),
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.message).toBe("User weight and ratings updated successfully");
    expect(data.weight).toBe(3);
    expect(data.updatedRatings).toHaveLength(1);
    expect(data.updatedRatings[0]).toEqual(mockTaskRatingUpdate);
  });

  // Test 5: Validación de datos de entrada
  test("debería manejar errores de validación Zod", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "test@example.com" },
    });

    const response = await PATCH(
      mockRequest({
        organizationId: "org123",
        newWeight: 6, // Mayor que el máximo permitido (5)
      }),
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid input data");
    expect(data.details).toBeDefined();
  });

  // Test 6: Error interno del servidor
  test("debería manejar errores internos correctamente", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "test@example.com" },
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.userOrganization.findUnique as jest.Mock).mockRejectedValue(
      new Error("Database error"),
    );

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    const response = await PATCH(
      mockRequest({
        organizationId: "org123",
        newWeight: 3,
      }),
    );

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error updating ratings:",
      expect.any(Error),
    );
    expect(data).toEqual({ error: "Internal server error" });
    consoleErrorSpy.mockRestore();
  });
});
