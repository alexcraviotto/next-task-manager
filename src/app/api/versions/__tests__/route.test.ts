/**
 * @jest-environment node
 */
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/database";
import { POST } from "../route";
import { NextRequest } from "next/server";

// Simulando los módulos
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/database", () => ({
  prisma: {
    userOrganization: {
      findFirst: jest.fn(),
    },
    version: {
      create: jest.fn(),
    },
    task: {
      findMany: jest.fn(),
    },
    versionTask: {
      createMany: jest.fn(),
    },
  },
}));

describe("POST /api/version", () => {
  let mockSession;

  beforeEach(() => {
    mockSession = { user: { id: "1" } };
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
  });

  it("should return 401 if the session is not valid", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const req = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    const res = await POST(req);
    const responseData = await res.json();
    expect(res.status).toBe(401);
    expect(responseData.message).toBe("Unauthorized");
  });

  it("should return 400 if required parameters are missing", async () => {
    const req = {
      json: jest.fn().mockResolvedValue({ organizationId: 1 }),
    } as unknown as NextRequest;

    const res = await POST(req);
    const responseData = await res.json();
    expect(res.status).toBe(400);
    expect(responseData.message).toBe("Invalid parameters");
  });

  it("should return 403 if the user does not belong to the organization", async () => {
    const req = {
      json: jest
        .fn()
        .mockResolvedValue({ organizationId: 1, versionName: "Test" }),
    } as unknown as NextRequest;

    (prisma.userOrganization.findFirst as jest.Mock).mockResolvedValue(null);

    const res = await POST(req);
    const responseData = await res.json();
    expect(res.status).toBe(403);
    expect(responseData.message).toBe(
      "Forbidden: User does not belong to this organization",
    );
  });

  it("should create a version and tasks if everything is valid", async () => {
    const req = {
      json: jest
        .fn()
        .mockResolvedValue({ organizationId: 1, versionName: "Test" }),
    } as unknown as NextRequest;

    (prisma.userOrganization.findFirst as jest.Mock).mockResolvedValue({
      userId: 1,
      organizationId: 1,
    });

    (prisma.version.create as jest.Mock).mockResolvedValue({
      id: 1,
      organizationId: 1,
      versionName: "Test",
    });

    (prisma.task.findMany as jest.Mock).mockResolvedValue([{ id: 1 }]);

    const res = await POST(req);
    const responseData = await res.json();
    expect(res.status).toBe(200);
    expect(responseData.version).toHaveProperty("id");
    expect(prisma.versionTask.createMany).toHaveBeenCalled();
  });

  it("should return 400 if an error occurs while creating a version", async () => {
    const req = {
      json: jest
        .fn()
        .mockResolvedValue({ organizationId: 1, versionName: "Test" }),
    } as unknown as NextRequest;

    (prisma.userOrganization.findFirst as jest.Mock).mockResolvedValue({
      userId: 1,
      organizationId: 1,
    });

    (prisma.version.create as jest.Mock).mockRejectedValue(
      new Error("Error creating version"),
    );

    const res = await POST(req);
    const responseData = await res.json();
    expect(res.status).toBe(400);
    expect(responseData.message).toBe("Error creating version");
  });
});
