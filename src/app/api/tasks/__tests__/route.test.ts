/**
 * @jest-environment node
 */
import { prisma } from "@/lib/database";
import { POST } from ".././route";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/database", () => ({
  prisma: {
    userOrganization: {
      findFirst: jest.fn(),
    },
    task: {
      create: jest.fn(),
    },
  },
}));

describe("POST /api/tasks/create", () => {
  it("should return 200 and create a task if valid data is provided", async () => {
    // Simula que el usuario está autenticado
    (getServerSession as jest.Mock).mockResolvedValueOnce({
      user: { id: "1", name: "Test User" },
    });

    // Simula que el usuario pertenece a la organización
    (prisma.userOrganization.findFirst as jest.Mock).mockResolvedValueOnce({
      userId: 1,
      organizationId: 1,
    });

    // Simula la creación de una nueva tarea
    (prisma.task.create as jest.Mock).mockResolvedValueOnce({
      id: 1,
      name: "New Task",
      description: "Task Description",
      type: "Task",
      startDate: new Date("2024-11-01"),
      endDate: new Date("2024-11-02"),
      organizationId: 1,
      createdById: 1,
    });

    const req = new Request("http://localhost:3001/api/tasks/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "New Task",
        description: "Task Description",
        type: "Task",
        startDate: "2024-11-01",
        endDate: "2024-11-02",
        progress: 1,
        organizationId: 1,
      }),
    }) as unknown as NextRequest;

    const response = await POST(req);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data).toEqual({
      task: {
        id: 1,
        name: "New Task",
        description: "Task Description",
        type: "Task",
        startDate: new Date("2024-11-01").toISOString(), // Se asegura de comparar en formato ISO
        endDate: new Date("2024-11-02").toISOString(), // Se asegura de comparar en formato ISO
        organizationId: 1,
        createdById: 1,
      },
    });
  });
});
