/**
 * @jest-environment node
 */

import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

// Mock de Prisma
const prismaClientMock = {
  userOrganization: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  taskRating: {
    findMany: jest.fn(),
    updateMany: jest.fn(),
  },
};

// Configuración de mocks
jest.mock("@/lib/database", () => ({
  prisma: prismaClientMock,
}));

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

import { PATCH } from "./route";

// Helper para crear mock de NextRequest
function createMockRequest(body: unknown): NextRequest {
  return {
    json: () => Promise.resolve(body),
  } as unknown as NextRequest;
}

describe("PATCH /api/member/[org_id]/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 404 when member is not found", async () => {
    // Mock authenticated session
    (getServerSession as jest.Mock).mockResolvedValueOnce({
      user: { email: "test@example.com" },
    });

    // Mock member not found
    prismaClientMock.userOrganization.findUnique.mockResolvedValueOnce(null);

    const req = createMockRequest({ weight: 3 });
    const params = { organizationId: "org123", userId: "1" };

    const response = await PATCH(req, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ error: "User not found in organization" });
  });

  it("should successfully update member weight", async () => {
    // Mock authenticated session
    (getServerSession as jest.Mock).mockResolvedValueOnce({
      user: { email: "test@example.com" },
    });

    // Mock existing member data
    prismaClientMock.userOrganization.findUnique.mockResolvedValueOnce({
      weight: 2,
    });

    // Mock task ratings
    prismaClientMock.taskRating.findMany.mockResolvedValueOnce([
      { taskId: 1, clientWeight: 1, clientSatisfaction: 3 },
    ]);

    // Mock successful updates
    prismaClientMock.taskRating.updateMany.mockResolvedValueOnce({});
    prismaClientMock.userOrganization.update.mockResolvedValueOnce({
      weight: 3,
    });

    const req = createMockRequest({ weight: 3 });
    const params = { organizationId: "org123", userId: "1" };

    const response = await PATCH(req, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ message: "Member weight updated successfully" });

    // Verify prisma calls
    expect(prismaClientMock.userOrganization.findUnique).toHaveBeenCalledWith({
      where: {
        userId_organizationId: {
          userId: 1,
          organizationId: "org123",
        },
      },
      select: { weight: true },
    });

    expect(prismaClientMock.userOrganization.update).toHaveBeenCalledWith({
      where: {
        userId_organizationId: {
          userId: 1,
          organizationId: "org123",
        },
      },
      data: { weight: 3 },
    });
  });

  it("should return 400 for invalid weight value", async () => {
    // Mock authenticated session
    (getServerSession as jest.Mock).mockResolvedValueOnce({
      user: { email: "test@example.com" },
    });

    const req = createMockRequest({ weight: 6 }); // Invalid weight > 5
    const params = { organizationId: "org123", userId: "1" };

    const response = await PATCH(req, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid input data");
  });

  it("should return 500 on database error", async () => {
    // Mock authenticated session
    (getServerSession as jest.Mock).mockResolvedValueOnce({
      user: { email: "test@example.com" },
    });

    // Mock member found
    prismaClientMock.userOrganization.findUnique.mockResolvedValueOnce({
      weight: 2,
    });

    // Mock database error
    prismaClientMock.taskRating.findMany.mockRejectedValueOnce(
      new Error("Database error"),
    );

    const req = createMockRequest({ weight: 3 });
    const params = { organizationId: "org123", userId: "1" };

    const response = await PATCH(req, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "Internal server error" });
  });
});
