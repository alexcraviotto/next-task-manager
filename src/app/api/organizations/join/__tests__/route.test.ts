/**
 * @jest-environment node
 */
import "dotenv/config";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";

jest.mock("next-auth/next");

const prismaClientMock = {
  user: {
    findUnique: jest.fn(),
  },
  organization: {
    findUnique: jest.fn(),
  },
  userOrganization: {
    create: jest.fn().mockImplementation((data) => Promise.resolve(data)),
  },
};

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => prismaClientMock),
}));

import { POST } from "../route";

describe("POST /api/organizations/join", () => {
  let req: NextRequest;

  beforeEach(() => {
    req = {
      json: jest.fn(),
    } as unknown as NextRequest;

    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "test@example.com" },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 if user is not authenticated", async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(null);
    const res = await POST(req);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "Unauthorized" });
  });

  it("should return 400 if organization id is not provided", async () => {
    (req.json as jest.Mock).mockResolvedValueOnce({});
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      message: "Organization ID is required",
    });
  });

  it("should return 404 if user is not found", async () => {
    (req.json as jest.Mock).mockResolvedValueOnce({ id: "org123" });
    prismaClientMock.user.findUnique.mockResolvedValueOnce(null);

    const res = await POST(req);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ message: "User not found" });
  });

  it("should return 404 if organization is not found", async () => {
    (req.json as jest.Mock).mockResolvedValueOnce({ id: "org123" });
    prismaClientMock.user.findUnique.mockResolvedValueOnce({ id: 1 });
    prismaClientMock.organization.findUnique.mockResolvedValueOnce(null);

    const res = await POST(req);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ message: "Organization not found" });
  });

  it("should return 400 if user is already a member", async () => {
    (req.json as jest.Mock).mockResolvedValueOnce({ id: "org123" });
    prismaClientMock.user.findUnique.mockResolvedValueOnce({ id: 1 });
    prismaClientMock.organization.findUnique.mockResolvedValueOnce({
      id: "org123",
      users: [{ userId: 1 }],
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ message: "Already a member" });
  });

  it("should successfully join organization", async () => {
    const mockOrg = { id: "org123", name: "Test Org", users: [] };
    (req.json as jest.Mock).mockResolvedValueOnce({ id: "org123" });
    prismaClientMock.user.findUnique.mockResolvedValueOnce({ id: 1 });
    prismaClientMock.organization.findUnique.mockResolvedValueOnce(mockOrg);
    prismaClientMock.userOrganization.create.mockResolvedValueOnce({
      userId: 1,
      organizationId: "org123",
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      message: "Successfully joined organization",
      organization: mockOrg,
    });
  });
});
