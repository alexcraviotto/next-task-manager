/**
 * @jest-environment node
 */
import "dotenv/config";
import { NextRequest } from "next/server";
import { Session } from "next-auth";
import { getServerSession } from "next-auth/next";

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

jest.mock("next-auth/next");

import { GET, POST, PATCH, DELETE } from "../route";

describe("Members API", () => {
  let req: NextRequest;
  let session: Partial<Session> | null;
  const id = "org-123";

  beforeEach(() => {
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
        name: "Admin User",
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
      prismaClientMock.user.findUnique.mockResolvedValueOnce({
        id: 1,
        email: "admin@example.com",
        organizations: [],
      });

      const res = await GET(req, { params: { id } });

      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ message: "Not a member" });
    });

    it("should return members list if user is authorized", async () => {
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

      prismaClientMock.user.findUnique.mockResolvedValueOnce({
        id: 1,
        email: "admin@example.com",
        organizations: [{ id, weight: 5 }],
      });

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

    it("should add a new member successfully", async () => {
      const newMember = {
        email: "newmember@example.com",
        weight: 3,
      };

      (req.json as jest.Mock).mockResolvedValueOnce(newMember);

      prismaClientMock.user.findUnique
        .mockResolvedValueOnce({
          id: 1,
          email: "test@gmail.com",
          createdOrgs: [{ id }],
          organizations: [{ id, weight: 5 }],
        })
        .mockResolvedValueOnce({
          id: 2,
          username: "newmember",
          email: "newmember@example.com",
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      prismaClientMock.userOrganization.findUnique.mockResolvedValueOnce(null);

      prismaClientMock.userOrganization.create.mockResolvedValueOnce({
        userId: 2,
        weight: 3,
        User: {
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

    it("should return 400 if weight is out of range", async () => {
      const newMember = {
        email: "newmember@example.com",
        weight: 6,
      };

      (req.json as jest.Mock).mockResolvedValueOnce(newMember);

      prismaClientMock.user.findUnique.mockResolvedValueOnce({
        id: 1,
        email: "admin@example.com",
        createdOrgs: [{ id }],
      });

      // Skip further execution by not mocking the user lookup
      // This will trigger the weight validation first

      const res = await POST(req, { params: { id } });

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({
        message: "Weight must be between 0 and 5",
      });
    });
  });

  describe("PATCH /api/organizations/[id]/members", () => {
    //let mockReq: NextRequest;
    //let mockOrgId: string;
    //let mockUserOrganizationUpdate: jest.Mock;

    /*beforeEach(() => {
      mockReq = req;
      mockOrgId = id;
      mockUserOrganizationUpdate = prismaClientMock.userOrganization.update;
    });
    */
    /*
    it("should update member weight successfully", async () => {
      const mockUpdateData = {
        id: 1,
        weight: 4,
      };
      (mockReq.json as jest.Mock).mockResolvedValueOnce(mockUpdateData);
      (getServerSession as jest.Mock).mockResolvedValue(session);

      prismaClientMock.user.findUnique.mockResolvedValueOnce({
        id: 1,
        email: "admin@example.com",
        createdOrgs: [{ id: mockOrgId }],
      });

      const mockUpdatedMember = {
        userId: 1,
        organizationId: mockOrgId,
        weight: 4,
        User: {
          id: 1,
          username: "testuser",
          email: "member@example.com",
          isAdmin: false,
          createdAt: new Date("2023-01-01"),
          updatedAt: new Date("2023-01-01"),
        },
      };

      mockUserOrganizationUpdate.mockResolvedValueOnce(mockUpdatedMember);

      const response = await PATCH(mockReq as NextRequest, { params: { id: mockOrgId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockUserOrganizationUpdate).toHaveBeenCalledWith({
        where: {
          userId_organizationId: {
            userId: mockUpdateData.id,
            organizationId: mockOrgId,
          },
        },
        data: {
          weight: mockUpdateData.weight,
        },
        include: {
          User: true,
        },
      });

      expect(data).toEqual({
        id: mockUpdatedMember.userId,
        username: mockUpdatedMember.User.username,
        email: mockUpdatedMember.User.email,
        isAdmin: mockUpdatedMember.User.isAdmin,
        createdAt: mockUpdatedMember.User.createdAt.toISOString(),
        updatedAt: mockUpdatedMember.User.updatedAt.toISOString(),
        weight: mockUpdatedMember.weight,
      });
    });
*/
    it("should return 400 if weight is out of range", async () => {
      const updateData = {
        id: 2,
        weight: -1,
      };

      (req.json as jest.Mock).mockResolvedValueOnce(updateData);

      prismaClientMock.user.findUnique.mockResolvedValueOnce({
        id: 1,
        email: "admin@example.com",
        createdOrgs: [{ id }],
      });

      const res = await PATCH(req, { params: { id } });

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({
        message: "Weight must be between 0 and 5",
      });
    });
  });

  describe("DELETE /api/organizations/[id]/members", () => {
    /*it("should delete member successfully", async () => {
      // Create URL with searchParams
      const url = new URL(
        `http://localhost:3000/api/organizations/${id}/members`
      );
      url.searchParams.append("memberId", "2");
      const newReq = {
        url: url.toString(),
        nextUrl: url,
      } as unknown as NextRequest;
      prismaClientMock.user.findUnique.mockResolvedValueOnce({
        id: 1,
        email: "admin@example.com",
        createdOrgs: [{ id }],
        organizations: [{ id, weight: 5 }],
      });
      const res = await DELETE(newReq, { params: { id } });
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
    */
    it("should return 400 if userId is not provided", async () => {
      // Create URL without searchParams
      const url = new URL(
        `http://localhost:3000/api/organizations/${id}/members`,
      );

      const newReq = {
        url: url.toString(),
        nextUrl: url,
      } as unknown as NextRequest;

      prismaClientMock.user.findUnique.mockResolvedValueOnce({
        id: 1,
        email: "admin@example.com",
        createdOrgs: [{ id }],
        organizations: [{ id, weight: 5 }],
      });

      const res = await DELETE(newReq, { params: { id } });

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ message: "User ID is required" });
    });
  });
});
