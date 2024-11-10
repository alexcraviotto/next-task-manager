/**
 * @jest-environment node
 */
import { DELETE, POST } from "../route";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/database";
import { getServerSession } from "next-auth/next";

jest.mock("@/lib/database", () => ({
  prisma: {
    version: {
      findUnique: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    versionTask: {
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    task: {
      findMany: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    taskRating: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

describe("Version API", () => {
  const mockSession = { user: { id: "1", name: "Test User" } };

  beforeEach(() => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
  });

  describe("DELETE /api/versions/:id", () => {
    it("should return 404 if version not found", async () => {
      (prisma.version.findUnique as jest.Mock).mockResolvedValue(null);

      const req = { url: "/api/versions/1" } as NextRequest;
      const res = await DELETE(req, { params: { id: "1" } });
      const responseData = await res.json();

      expect(res.status).toBe(404);
      expect(responseData.error).toBe("Version not found");
    });

    it("should return 500 if there is an error deleting the version", async () => {
      (prisma.version.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.$transaction as jest.Mock).mockRejectedValue(
        new Error("Error deleting version"),
      );

      const req = { url: "/api/versions/1" } as NextRequest;
      const res = await DELETE(req, { params: { id: "1" } });
      const responseData = await res.json();

      expect(res.status).toBe(500);
      expect(responseData.error).toBe(
        "Error deleting version and related records",
      );
    });

    it("should delete the version successfully", async () => {
      (prisma.version.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.$transaction as jest.Mock).mockResolvedValue({});

      const req = { url: "/api/versions/1" } as NextRequest;
      const res = await DELETE(req, { params: { id: "1" } });
      const responseData = await res.json();

      expect(res.status).toBe(200);
      expect(responseData.message).toBe(
        "Version and related records deleted successfully",
      );
    });
  });

  describe("POST /api/versions/:id/apply", () => {
    it("should return 404 if version not found", async () => {
      (prisma.version.findUnique as jest.Mock).mockResolvedValue(null);

      const req = { url: "/api/versions/1/apply" } as NextRequest;
      const res = await POST(req, { params: { id: "1" } });
      const responseData = await res.json();

      expect(res.status).toBe(404);
      expect(responseData.error).toBe("Version not found");
    });

    it("should return 500 if there is an error during version rollback", async () => {
      (prisma.version.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        versionTasks: [{ Task: { id: 1 } }],
        organizationId: 1,
      });
      (prisma.task.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.$transaction as jest.Mock).mockRejectedValue(
        new Error("Error during transaction"),
      );

      const req = { url: "/api/versions/1/apply" } as NextRequest;
      const res = await POST(req, { params: { id: "1" } });
      const responseData = await res.json();

      expect(res.status).toBe(500);
      expect(responseData.error).toBe("Error applying version rollback");
    });
  });
});
