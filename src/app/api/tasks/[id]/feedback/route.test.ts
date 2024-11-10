/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";

// Mock de Prisma
const prismaClientMock = {
  taskRating: {
    updateMany: jest.fn(),
    findFirst: jest.fn(),
  },
};

// Configuración de mocks
jest.mock("@/lib/database", () => ({
  prisma: prismaClientMock,
}));

import { PATCH } from "./route";

describe("PATCH /api/tasks/[taskId]/feedback", () => {
  const mockParams = {
    organizationId: "org123",
    taskId: "1",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper function para crear un mock request
  const createRequest = (body: unknown) => {
    return new NextRequest("http://localhost:3001", {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  };

  describe("Input validation", () => {
    it("should return 400 if neither effort nor clientWeight is provided", async () => {
      const req = createRequest({
        organizationId: "org123", // Añadir el organizationId requerido
      });
      const response = await PATCH(req, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: "At least one field (effort or clientWeight) must be provided",
      });
    });

    it("should return 400 if effort is out of range", async () => {
      const req = createRequest({
        organizationId: "org123",
        effort: 6,
      });
      const response = await PATCH(req, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid input data");
    });

    it("should return 400 if clientWeight is out of range", async () => {
      const req = createRequest({ organizationId: "org123", clientWeight: -1 });
      const response = await PATCH(req, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid input data");
    });
  });

  describe("Effort update", () => {
    it("should successfully update effort", async () => {
      const req = createRequest({ organizationId: "org123", effort: 3 });
      prismaClientMock.taskRating.updateMany.mockResolvedValueOnce({
        count: 1,
      });

      const response = await PATCH(req, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ message: "Task updated successfully" });
      expect(prismaClientMock.taskRating.updateMany).toHaveBeenCalledWith({
        where: {
          taskId: 1,
          task: { organizationId: mockParams.organizationId },
        },
        data: { effort: 3 },
      });
    });
  });

  describe("Client weight update", () => {
    it("should return 404 if task rating is not found", async () => {
      const req = createRequest({ organizationId: "org123", clientWeight: 4 });
      prismaClientMock.taskRating.findFirst.mockResolvedValueOnce(null);

      const response = await PATCH(req, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: "Task rating not found" });
    });

    it("should return 400 if previous rating values are null", async () => {
      const req = createRequest({ organizationId: "org123", clientWeight: 4 });
      prismaClientMock.taskRating.findFirst.mockResolvedValueOnce({
        clientWeight: null,
        clientSatisfaction: null,
      });

      const response = await PATCH(req, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: "Invalid rating values: satisfaction or weight is null",
      });
    });

    it("should successfully update client weight and satisfaction", async () => {
      const req = createRequest({ organizationId: "org123", clientWeight: 4 });
      prismaClientMock.taskRating.findFirst.mockResolvedValueOnce({
        clientWeight: 3,
        clientSatisfaction: 4,
      });
      prismaClientMock.taskRating.updateMany.mockResolvedValueOnce({
        count: 1,
      });

      const response = await PATCH(req, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ message: "Task updated successfully" });
      expect(prismaClientMock.taskRating.updateMany).toHaveBeenCalledWith({
        where: {
          taskId: 1,
          task: { organizationId: mockParams.organizationId },
        },
        data: {
          clientWeight: 4,
          clientSatisfaction: 5, // (4/3) * 4 = 5.33, normalizado a 5
        },
      });
    });
  });

  describe("Error handling", () => {
    it("should return 500 on unexpected error", async () => {
      const req = createRequest({ organizationId: "org123", effort: 3 });
      prismaClientMock.taskRating.updateMany.mockRejectedValueOnce(
        new Error("Database error"),
      );

      const response = await PATCH(req, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: "Internal server error" });
    });

    it("should handle both effort and clientWeight updates", async () => {
      const req = createRequest({
        organizationId: "org123",
        effort: 3,
        clientWeight: 4,
      });
      prismaClientMock.taskRating.findFirst.mockResolvedValueOnce({
        clientWeight: 3,
        clientSatisfaction: 4,
      });
      prismaClientMock.taskRating.updateMany.mockResolvedValueOnce({
        count: 1,
      });

      const response = await PATCH(req, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ message: "Task updated successfully" });
      expect(prismaClientMock.taskRating.updateMany).toHaveBeenCalledTimes(2);
    });
  });
});
