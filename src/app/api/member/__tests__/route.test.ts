/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/database";
import { PATCH } from "../route";

// Mock de dependencias
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

describe("PATCH /api/member/route - Update User Weights and Ratings", () => {
  const mockRequest = (body: unknown) =>
    new NextRequest(
      new Request("http://localhost:3001", {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Caso 1: Usuario no autenticado
  test("debería retornar 401 si el usuario no está autenticado", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const response = await PATCH(
      mockRequest({ organizationId: "org123", newWeight: 3 }),
    );

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data).toEqual({ error: "Unauthorized" });
  });

  // Caso 2: Usuario no encontrado en la base de datos
  test("debería retornar 404 si el usuario no existe", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "test@example.com" },
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await PATCH(
      mockRequest({ organizationId: "org123", newWeight: 3 }),
    );

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data).toEqual({ error: "User not found" });
  });

  // Caso 3: Usuario no pertenece a la organización
  test("debería retornar 404 si el usuario no pertenece a la organización", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "test@example.com" },
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
    (prisma.userOrganization.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await PATCH(
      mockRequest({ organizationId: "org123", newWeight: 3 }),
    );

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data).toEqual({ error: "User not found in organization" });
  });

  // Caso 4: Validación de datos de entrada fallida
  test("debería retornar 400 si los datos de entrada no son válidos", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "test@example.com" },
    });

    const response = await PATCH(
      mockRequest({ organizationId: "org123", newWeight: -1 }), // Peso inválido
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid input data");
    expect(data.details).toBeDefined();
    expect(data.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: expect.stringMatching(/greater than or equal to 0/), // Coincidencia más flexible
        }),
      ]),
    );
  });

  // Caso 5: Actualización exitosa
  test("debería actualizar los pesos y calificaciones correctamente", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "test@example.com" },
    });

    const mockUser = {
      id: 1,
      taskRatings: [
        {
          id: 1,
          taskId: 1,
          clientWeight: 2,
          clientSatisfaction: 4,
          task: { organizationId: "org123" },
        },
      ],
    };

    const mockUserOrg = {
      userId: 1,
      organizationId: "org123",
      weight: 2,
    };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.userOrganization.findUnique as jest.Mock).mockResolvedValue(
      mockUserOrg,
    );
    (prisma.taskRating.update as jest.Mock).mockResolvedValue({
      id: 1,
      taskId: 1,
      clientSatisfaction: 6,
      clientWeight: 2,
    });
    (prisma.userOrganization.update as jest.Mock).mockResolvedValue({
      userId: 1,
      organizationId: "org123",
      weight: 3,
    });

    const response = await PATCH(
      mockRequest({ organizationId: "org123", newWeight: 3 }),
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.message).toBe("User weight and ratings updated successfully");
    expect(data.weight).toBe(3);
    expect(data.updatedRatings).toHaveLength(1);
    expect(data.updatedRatings[0]).toEqual({
      id: 1,
      taskId: 1,
      clientSatisfaction: 6,
      clientWeight: 2,
    });
  });

  // Caso 6: Error interno del servidor
  test("debería manejar errores internos correctamente", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "test@example.com" },
    });
    (prisma.user.findUnique as jest.Mock).mockRejectedValue(
      new Error("Database error"),
    );

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    const response = await PATCH(
      mockRequest({ organizationId: "org123", newWeight: 3 }),
    );

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("Internal server error");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error updating ratings:",
      expect.any(Error),
    );
    consoleErrorSpy.mockRestore();
  });
});
