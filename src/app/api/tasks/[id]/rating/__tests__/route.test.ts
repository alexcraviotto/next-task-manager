/**
 * @jest-environment node
 */

// route.test.ts
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/database";
import { GET } from "../route";

// Mock de las dependencias
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/database", () => ({
  prisma: {
    taskRating: {
      findFirst: jest.fn(),
    },
  },
}));

describe("GET task rating endpoint", () => {
  // Antes de cada test, limpiamos los mocks
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: Usuario no autenticado
  test("debería retornar 401 si el usuario no está autenticado", async () => {
    // Configurar el mock de getServerSession para simular usuario no autenticado
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest(
      new Request("http://localhost:3001"),
    ) as unknown as NextRequest;
    const response = await GET(request, { params: { id: "1" } });

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data).toEqual({ error: "Unauthorized" });
  });

  // Test 2: Obtener calificación existente
  test("debería retornar la calificación cuando existe", async () => {
    // Simular usuario autenticado
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "test@example.com" },
    });

    // Simular que encontramos una calificación en la base de datos
    const mockRating = {
      effort: 5,
      clientWeight: 3,
      clientSatisfaction: 4,
    };
    (prisma.taskRating.findFirst as jest.Mock).mockResolvedValue(mockRating);

    const request = new NextRequest(
      new Request("http://localhost:3001"),
    ) as unknown as NextRequest;
    const response = await GET(request, { params: { id: "1" } });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual(mockRating);
  });

  // Test 3: Cuando no existe calificación
  test("debería retornar valores por defecto cuando no existe calificación", async () => {
    // Simular usuario autenticado
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "test@example.com" },
    });

    // Simular que no encontramos calificación
    (prisma.taskRating.findFirst as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest(
      new Request("http://localhost:3001"),
    ) as unknown as NextRequest;
    const response = await GET(request, { params: { id: "1" } });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({
      effort: 0,
      clientWeight: 0,
      clientSatisfaction: 0,
    });
  });

  // Test 4: Error al consultar la base de datos
  test("debería retornar 500 cuando hay un error en la base de datos", async () => {
    // Simular usuario autenticado
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "test@example.com" },
    });

    // Simular un error en la consulta a la base de datos
    (prisma.taskRating.findFirst as jest.Mock).mockRejectedValue(
      new Error("Database connection error"),
    );

    // Espiar console.error
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    const request = new NextRequest(
      new Request("http://localhost:3001"),
    ) as unknown as NextRequest;
    const response = await GET(request, { params: { id: "1" } });

    // Verificar que se llamó a console.error con el mensaje correcto
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error fetching task rating:",
      expect.any(Error),
    );

    // Restaurar console.error
    consoleErrorSpy.mockRestore();

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toEqual({ error: "Internal server error" });
  });
});
