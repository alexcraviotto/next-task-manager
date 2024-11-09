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
      update: jest.fn(),
    },
    organization: {
      findUnique: jest.fn(),
    },
    task: {
      updateMany: jest.fn(),
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
      (prisma.version.delete as jest.Mock).mockRejectedValue(
        new Error("Error deleting version"),
      );

      const req = { url: "/api/versions/1" } as NextRequest;
      const res = await DELETE(req, { params: { id: "1" } });
      const responseData = await res.json();

      expect(res.status).toBe(500);
      expect(responseData.error).toBe("Error deleting version");
    });

    it("should delete the version successfully", async () => {
      (prisma.version.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.version.delete as jest.Mock).mockResolvedValue({});

      const req = { url: "/api/versions/1" } as NextRequest;
      const res = await DELETE(req, { params: { id: "1" } });
      const responseData = await res.json();

      expect(res.status).toBe(200);
      expect(responseData.message).toBe("Version deleted successfully");
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

    it("should return 404 if organization not found", async () => {
      (prisma.version.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        versionTasks: [{ Task: { id: 1 } }],
        organizationId: 1,
      });
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(null);

      const req = { url: "/api/versions/1/apply" } as NextRequest;
      const res = await POST(req, { params: { id: "1" } });
      const responseData = await res.json();

      expect(res.status).toBe(404);
      expect(responseData.error).toBe("Organization not found");
    });

    it("should apply the version tasks successfully", async () => {
      const version = {
        id: 1,
        versionTasks: [
          { Task: { id: 1, organizationId: null } },
          { Task: { id: 2, organizationId: null } },
        ],
        organizationId: 1,
      };

      const organization = { id: 1 };

      (prisma.version.findUnique as jest.Mock).mockResolvedValue(version);
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(
        organization,
      );
      (prisma.task.updateMany as jest.Mock).mockResolvedValue({ count: 2 });
      (prisma.$transaction as jest.Mock).mockResolvedValue(null);

      console.log("Version before apply:", version);
      console.log("Organization before apply:", organization);

      const req = { url: "/api/versions/1/apply" } as NextRequest;
      const res = await POST(req, { params: { id: "1" } });
      const responseData = await res.json();

      console.log("Response data:", responseData);
      console.log(
        "Tasks updated:",
        (prisma.task.updateMany as jest.Mock).mock.calls,
      );

      expect(res.status).toBe(200);
      expect(responseData.message).toBe("Version applied successfully");

      expect(prisma.task.updateMany).toHaveBeenCalledWith({
        where: { id: 1, organizationId: undefined },
        data: { organizationId: 1 },
      });
      expect(prisma.task.updateMany).toHaveBeenCalledWith({
        where: { id: 2, organizationId: undefined },
        data: { organizationId: 1 },
      });
    });
  });
});
