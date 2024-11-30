/**
 * @jest-environment node
 */
import { prisma } from "@/lib/database";
import { PUT, DELETE, GET } from "../route";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/database", () => ({
  prisma: {
    task: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe("Task Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("PUT /api/tasks/:id", () => {
    it("should return 200 and update the task if valid data is provided", async () => {
      const mockSession = { user: { id: "1" } };
      (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

      const mockTask = {
        id: 1,
        name: "Old Task",
        description: "Old Description",
        type: "Task",
        startDate: new Date("2024-11-01"),
        endDate: new Date("2024-11-02"),
        createdById: 1,
      };

      (prisma.task.findUnique as jest.Mock).mockResolvedValueOnce(mockTask);
      (prisma.task.update as jest.Mock).mockResolvedValueOnce({
        ...mockTask,
        name: "Updated Task",
        description: "Updated Description",
        startDate: new Date("2024-11-05"),
        endDate: new Date("2024-11-06"),
      });

      const req = new Request("http://localhost:3001/api/tasks/1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Updated Task",
          description: "Updated Description",
          type: "Task",
          startDate: "2024-11-05",
          endDate: "2024-11-06",
        }),
      }) as unknown as NextRequest;

      const response = await PUT(req, { params: { id: "1" } });
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.task.name).toBe("Updated Task");
      expect(data.task.description).toBe("Updated Description");
    });

    it("should return 401 if user is not authenticated", async () => {
      (getServerSession as jest.Mock).mockResolvedValueOnce(null);

      const req = new Request("http://localhost:3001/api/tasks/1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Updated Task",
          description: "Updated Description",
          type: "Task",
          startDate: "2024-11-05",
          endDate: "2024-11-06",
        }),
      }) as unknown as NextRequest;

      const response = await PUT(req, { params: { id: "1" } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.message).toBe("Unauthorized");
    });

    it("should return 400 if progress is less than 0", async () => {
      const mockSession = { user: { id: "1" } };
      (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

      const mockTask = {
        id: 1,
        createdById: 1,
      };
      (prisma.task.findUnique as jest.Mock).mockResolvedValueOnce(mockTask);

      const req = new Request("http://localhost:3001/api/tasks/1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Task",
          description: "Description",
          type: "Task",
          startDate: "2024-11-05",
          endDate: "2024-11-06",
          progress: -1,
        }),
      }) as unknown as NextRequest;

      const response = await PUT(req, { params: { id: "1" } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Progress must be between 0 and 100");
    });

    it("should return 400 if progress is greater than 100", async () => {
      const mockSession = { user: { id: "1" } };
      (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

      const mockTask = {
        id: 1,
        createdById: 1,
        name: "Test Task",
        type: "task",
        startDate: new Date(),
        endDate: new Date(),
      };

      (prisma.task.findUnique as jest.Mock).mockResolvedValueOnce(mockTask);

      const req = new Request("http://localhost:3001/api/tasks/1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Task",
          description: "Description",
          type: "Task",
          startDate: "2024-11-05",
          endDate: "2024-11-06",
          progress: 101,
        }),
      }) as unknown as NextRequest;

      const response = await PUT(req, { params: { id: "1" } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Progress must be between 0 and 100");
      expect(prisma.task.update).not.toHaveBeenCalled();
    });

    it("should update task with valid progress value", async () => {
      const mockSession = { user: { id: "1" } };
      (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

      const mockTask = {
        id: 1,
        name: "Old Task",
        description: "Old Description",
        type: "Task",
        startDate: new Date("2024-11-01"),
        endDate: new Date("2024-11-02"),
        progress: 50,
        createdById: 1,
      };

      (prisma.task.findUnique as jest.Mock).mockResolvedValueOnce(mockTask);
      (prisma.task.update as jest.Mock).mockResolvedValueOnce({
        ...mockTask,
        progress: 75,
      });

      const req = new Request("http://localhost:3001/api/tasks/1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Task",
          description: "Description",
          type: "Task",
          startDate: "2024-11-05",
          endDate: "2024-11-06",
          progress: 75,
        }),
      }) as unknown as NextRequest;

      const response = await PUT(req, { params: { id: "1" } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.task.progress).toBe(75);
    });

    it("should return 404 if task is not found", async () => {
      const mockSession = { user: { id: "1" } };
      (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

      (prisma.task.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const req = new Request("http://localhost:3001/api/tasks/1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Updated Task",
          description: "Updated Description",
          type: "Task",
          startDate: "2024-11-05",
          endDate: "2024-11-06",
        }),
      }) as unknown as NextRequest;

      const response = await PUT(req, { params: { id: "1" } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Task not found");
    });

    it("should return 400 if name is not provided", async () => {
      const mockSession = { user: { id: "1" } };
      (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

      const mockTask = {
        id: 1,
        createdById: 1,
      };
      (prisma.task.findUnique as jest.Mock).mockResolvedValueOnce(mockTask);

      const req = new Request("http://localhost:3001/api/tasks/1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "",
          description: "Updated Description",
          type: "Task",
          startDate: "2024-11-05",
          endDate: "2024-11-06",
        }),
      }) as unknown as NextRequest;

      const response = await PUT(req, { params: { id: "1" } });
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBe(
        "Required fields missing (name, type, startDate, endDate)",
      );
    });

    it("should handle deselected field update separately", async () => {
      const mockSession = { user: { id: "1" } };
      (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

      const mockTask = {
        id: 1,
        createdById: 1,
      };
      (prisma.task.findUnique as jest.Mock).mockResolvedValueOnce(mockTask);
      (prisma.task.update as jest.Mock).mockResolvedValueOnce({
        ...mockTask,
        deselected: true,
      });

      const req = new Request("http://localhost:3001/api/tasks/1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deselected: true }),
      }) as unknown as NextRequest;

      const response = await PUT(req, { params: { id: "1" } });
      expect(response.status).toBe(201);
    });

    it("should return 400 if required fields are missing", async () => {
      const mockSession = { user: { id: "1" } };
      (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

      const mockTask = {
        id: 1,
        createdById: 1,
      };
      (prisma.task.findUnique as jest.Mock).mockResolvedValueOnce(mockTask);

      const req = new Request("http://localhost:3001/api/tasks/1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "",
          description: "Updated Description",
        }),
      }) as unknown as NextRequest;

      const response = await PUT(req, { params: { id: "1" } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(
        "Required fields missing (name, type, startDate, endDate)",
      );
    });

    it("should validate progress range", async () => {
      const mockSession = { user: { id: "1" } };
      (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

      const mockTask = {
        id: 1,
        createdById: 1,
      };
      (prisma.task.findUnique as jest.Mock).mockResolvedValueOnce(mockTask);

      const req = new Request("http://localhost:3001/api/tasks/1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Task",
          type: "task",
          startDate: "2024-01-01",
          endDate: "2024-01-02",
          progress: 101,
        }),
      }) as unknown as NextRequest;

      const response = await PUT(req, { params: { id: "1" } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Progress must be between 0 and 100");
    });
  });

  describe("DELETE /api/tasks/:id", () => {
    it("should return 200 and delete the task if valid task ID is provided", async () => {
      const mockSession = { user: { id: "1" } };
      (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

      const mockTask = {
        id: 1,
        name: "Task to Delete",
        description: "Task Description",
        type: "Task",
        startDate: new Date("2024-11-01"),
        endDate: new Date("2024-11-02"),
        createdById: 1,
      };

      (prisma.task.findUnique as jest.Mock).mockResolvedValueOnce(mockTask);
      (prisma.task.delete as jest.Mock).mockResolvedValueOnce(mockTask);

      const req = new Request("http://localhost:3001/api/tasks/1", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      }) as unknown as NextRequest;

      const response = await DELETE(req, { params: { id: "1" } });
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.message).toBe("Task deleted successfully");
    });

    it("should return 401 if user is not authenticated", async () => {
      (getServerSession as jest.Mock).mockResolvedValueOnce(null);

      const req = new Request("http://localhost:3001/api/tasks/1", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      }) as unknown as NextRequest;

      const response = await DELETE(req, { params: { id: "1" } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.message).toBe("Unauthorized");
    });

    it("should return 404 if task is not found", async () => {
      const mockSession = { user: { id: "1" } };
      (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

      (prisma.task.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const req = new Request("http://localhost:3001/api/tasks/1", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      }) as unknown as NextRequest;

      const response = await DELETE(req, { params: { id: "1" } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Task not found");
    });

    it("should return 403 if user is not the creator of the task", async () => {
      const mockSession = { user: { id: "2" } };
      (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

      const mockTask = {
        id: 1,
        name: "Task to Delete",
        description: "Task Description",
        type: "Task",
        startDate: new Date("2024-11-01"),
        endDate: new Date("2024-11-02"),
        createdById: 1,
      };

      (prisma.task.findUnique as jest.Mock).mockResolvedValueOnce(mockTask);

      const req = new Request("http://localhost:3001/api/tasks/1", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      }) as unknown as NextRequest;

      const response = await DELETE(req, { params: { id: "1" } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.message).toBe("Forbidden");
    });
  });

  describe("GET /api/tasks/:id", () => {
    it("should return 200 and retrieve the task if it exists", async () => {
      const mockSession = { user: { id: "1" } };
      (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

      const mockTask = {
        id: 1,
        name: "Existing Task",
        description: "Existing Task Description",
        type: "Task",
        startDate: new Date("2024-11-01"),
        endDate: new Date("2024-11-02"),
        createdById: 1,
      };

      (prisma.task.findUnique as jest.Mock).mockResolvedValueOnce(mockTask);

      const req = new Request("http://localhost:3001/api/tasks/1", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }) as unknown as NextRequest;

      const response = await GET(req, { params: { id: "1" } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.task.name).toBe("Existing Task");
      expect(data.task.description).toBe("Existing Task Description");
    });

    it("should return 401 if user is not authenticated", async () => {
      (getServerSession as jest.Mock).mockResolvedValueOnce(null);

      const req = new Request("http://localhost:3001/api/tasks/1", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }) as unknown as NextRequest;

      const response = await GET(req, { params: { id: "1" } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.message).toBe("Unauthorized");
    });

    it("should return 404 if task is not found", async () => {
      const mockSession = { user: { id: "1" } };
      (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

      (prisma.task.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const req = new Request("http://localhost:3001/api/tasks/1", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }) as unknown as NextRequest;

      const response = await GET(req, { params: { id: "1" } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Task not found");
    });
  });
});
