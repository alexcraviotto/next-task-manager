/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { Session } from "next-auth";

// Mock las variables de entorno
process.env.TURSO_DATABASE_URL = "mock://test-db";
process.env.TURSO_AUTH_TOKEN = "mock-token";

// Mock de Prisma y next-auth antes de importar los módulos que los usan
const prismaClientMock = {
  user: {
    findUnique: jest.fn(),
  },
  userOrganization: {
    findMany: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => prismaClientMock),
}));

jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

// Mock de la base de datos
jest.mock("@/lib/database", () => ({
  prisma: prismaClientMock,
}));

// Importar después de los mocks
import { getServerSession } from "next-auth/next";
import { GET, POST, PATCH, DELETE } from "../route";

describe("Members API", () => {
  let req: NextRequest;
  let session: Partial<Session> | null;
  const id = "org-123";

  beforeEach(() => {
    // Resto del código del beforeEach igual que antes...
    const url = new URL(
      `http://localhost:3000/api/organizations/${id}/members`,
    );
    req = {
      json: jest.fn(),
      url: url.toString(),
      nextUrl: url,
    } as unknown as NextRequest;

    session = {
      user: {
        id: "1",
        email: "admin@example.com",
        username: "Admin User",
        isAdmin: true,
      },
    };

    (getServerSession as jest.Mock).mockResolvedValue(session);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/organizations/[id]/members", () => {
    it("should return 401 if user is not authenticated", async () => {
      (getServerSession as jest.Mock).mockResolvedValueOnce(null);

      const res = await GET(req, { params: { id } });

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ message: "Unauthorized" });
    });

    it("should return 403 if user is not a member", async () => {
      prismaClientMock.userOrganization.findUnique.mockResolvedValueOnce(null);

      const res = await GET(req, { params: { id } });

      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ message: "Not a member" });
    });

    it("should return members list if user is authorized", async () => {
      // Mock that user is a member
      prismaClientMock.userOrganization.findUnique.mockResolvedValueOnce({
        userId: 1,
        organizationId: id,
        weight: 5,
      });

      // Mock members list
      const mockMembers = [
        {
          userId: 1,
          weight: 5,
          User: {
            id: 1,
            username: "user1",
            email: "user1@example.com",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];

      prismaClientMock.userOrganization.findMany.mockResolvedValueOnce(
        mockMembers,
      );

      const res = await GET(req, { params: { id } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0]).toHaveProperty("username", "user1");
      expect(data[0]).toHaveProperty("isAdmin", true);
    });
  });

  describe("POST /api/organizations/[id]/members", () => {
    it("should return 401 if user is not authenticated", async () => {
      (getServerSession as jest.Mock).mockResolvedValueOnce(null);

      const res = await POST(req, { params: { id } });

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ message: "Unauthorized" });
    });

    it("should return 400 if weight is out of range", async () => {
      const newMember = {
        email: "newmember@example.com",
        weight: 6,
      };

      (req.json as jest.Mock).mockResolvedValueOnce(newMember);

      const res = await POST(req, { params: { id } });

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({
        message: "Weight must be between 0 and 5",
      });
    });

    it("should return 403 if user is not admin", async () => {
      const newMember = {
        email: "newmember@example.com",
        weight: 3,
      };

      (req.json as jest.Mock).mockResolvedValueOnce(newMember);

      prismaClientMock.userOrganization.findUnique.mockResolvedValueOnce({
        userId: 1,
        organizationId: id,
        weight: 3, // Not admin weight
      });

      const res = await POST(req, { params: { id } });

      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ message: "Not authorized" });
    });

    it("should return 404 if user to add is not found", async () => {
      const newMember = {
        email: "nonexistent@example.com",
        weight: 3,
      };

      (req.json as jest.Mock).mockResolvedValueOnce(newMember);

      prismaClientMock.userOrganization.findUnique.mockResolvedValueOnce({
        userId: 1,
        organizationId: id,
        weight: 5,
      });

      prismaClientMock.user.findUnique.mockResolvedValueOnce(null);

      const res = await POST(req, { params: { id } });

      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ message: "User not found" });
    });

    it("should return 400 if user is already a member", async () => {
      const newMember = {
        email: "existing@example.com",
        weight: 3,
      };

      (req.json as jest.Mock).mockResolvedValueOnce(newMember);

      prismaClientMock.userOrganization.findUnique
        .mockResolvedValueOnce({
          userId: 1,
          organizationId: id,
          weight: 5,
        })
        .mockResolvedValueOnce({
          userId: 2,
          organizationId: id,
          weight: 3,
        });

      prismaClientMock.user.findUnique.mockResolvedValueOnce({
        id: 2,
        email: "existing@example.com",
      });

      const res = await POST(req, { params: { id } });

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ message: "Already a member" });
    });

    it("should add a new member successfully", async () => {
      const newMember = {
        email: "newmember@example.com",
        weight: 3,
      };

      (req.json as jest.Mock).mockResolvedValueOnce(newMember);

      prismaClientMock.userOrganization.findUnique
        .mockResolvedValueOnce({
          userId: 1,
          organizationId: id,
          weight: 5,
        })
        .mockResolvedValueOnce(null);

      prismaClientMock.user.findUnique.mockResolvedValueOnce({
        id: 2,
        username: "newmember",
        email: "newmember@example.com",
      });

      prismaClientMock.userOrganization.create.mockResolvedValueOnce({
        userId: 2,
        organizationId: id,
        weight: 3,
        User: {
          id: 2,
          username: "newmember",
          email: "newmember@example.com",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const res = await POST(req, { params: { id } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveProperty("email", "newmember@example.com");
      expect(data).toHaveProperty("weight", 3);
    });
  });

  describe("PATCH /api/organizations/[id]/members", () => {
    it("should return 401 if user is not authenticated", async () => {
      (getServerSession as jest.Mock).mockResolvedValueOnce(null);

      const res = await PATCH(req, { params: { id } });

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ message: "Unauthorized" });
    });

    it("should return 400 if weight is out of range", async () => {
      const updateData = {
        id: 2,
        weight: 6,
      };

      (req.json as jest.Mock).mockResolvedValueOnce(updateData);

      const res = await PATCH(req, { params: { id } });

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({
        message: "Weight must be between 0 and 5",
      });
    });

    it("should return 403 if user is not admin", async () => {
      const updateData = {
        id: 2,
        weight: 3,
      };

      (req.json as jest.Mock).mockResolvedValueOnce(updateData);

      prismaClientMock.userOrganization.findUnique.mockResolvedValueOnce({
        userId: 1,
        organizationId: id,
        weight: 3, // Not admin weight
      });

      const res = await PATCH(req, { params: { id } });

      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ message: "Not authorized" });
    });

    it("should update member weight successfully", async () => {
      const updateData = {
        id: 2,
        weight: 4,
      };

      (req.json as jest.Mock).mockResolvedValueOnce(updateData);

      prismaClientMock.userOrganization.findUnique.mockResolvedValueOnce({
        userId: 1,
        organizationId: id,
        weight: 5,
      });

      prismaClientMock.userOrganization.update.mockResolvedValueOnce({
        userId: 2,
        organizationId: id,
        weight: 4,
        User: {
          id: 2,
          username: "member",
          email: "member@example.com",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const res = await PATCH(req, { params: { id } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveProperty("weight", 4);
    });
  });

  describe("DELETE /api/organizations/[id]/members", () => {
    it("should return 401 if user is not authenticated", async () => {
      (getServerSession as jest.Mock).mockResolvedValueOnce(null);

      const res = await DELETE(req, { params: { id } });

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ message: "Unauthorized" });
    });

    it("should return 400 if memberId is not provided", async () => {
      const res = await DELETE(req, { params: { id } });

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ message: "User ID is required" });
    });

    it("should return 403 if user is not admin", async () => {
      const url = new URL(
        `http://localhost:3000/api/organizations/${id}/members?memberId=2`,
      );
      const reqWithMemberId = {
        ...req,
        url: url.toString(),
        nextUrl: url,
      } as unknown as NextRequest;

      prismaClientMock.userOrganization.findUnique.mockResolvedValueOnce({
        userId: 1,
        organizationId: id,
        weight: 3, // Not admin weight
      });

      const res = await DELETE(reqWithMemberId, { params: { id } });

      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ message: "Not authorized" });
    });

    it("should delete member successfully", async () => {
      const url = new URL(
        `http://localhost:3000/api/organizations/${id}/members?memberId=2`,
      );
      const reqWithMemberId = {
        ...req,
        url: url.toString(),
        nextUrl: url,
      } as unknown as NextRequest;

      prismaClientMock.userOrganization.findUnique.mockResolvedValueOnce({
        userId: 1,
        organizationId: id,
        weight: 5,
      });

      prismaClientMock.userOrganization.delete.mockResolvedValueOnce({
        userId: 2,
        organizationId: id,
      });

      const res = await DELETE(reqWithMemberId, { params: { id } });

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        message: "Member deleted successfully",
      });
      expect(prismaClientMock.userOrganization.delete).toHaveBeenCalledWith({
        where: {
          userId_organizationId: {
            userId: 2,
            organizationId: id,
          },
        },
      });
    });
  });
});
