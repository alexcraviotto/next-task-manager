/**
 * @jest-environment node
 */
import "dotenv/config";

import { NextRequest } from "next/server";
const prismaClientMock = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  organization: {
    findUnique: jest.fn(),
    create: jest.fn().mockImplementation((data) => Promise.resolve(data)),
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
  userOrganization: {
    create: jest.fn().mockImplementation((data) => Promise.resolve(data)),
  },
};

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => prismaClientMock),
}));
import { GET, POST } from "../route";
import { getServerSession } from "next-auth/next";
import { Session } from "next-auth";

jest.mock("next-auth/next");

describe("POST /api/organizations", () => {
  let req: NextRequest;
  let session: Partial<Session> | null;

  beforeEach(() => {
    req = {
      json: jest.fn(),
    } as unknown as NextRequest;

    session = {
      user: {
        id: "1",
        email: "test@example.com",
        isAdmin: false,
        username: "test",
      },
    };

    (getServerSession as jest.Mock).mockResolvedValue(session);
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

  it("should return 400 if name is not provided", async () => {
    (req.json as jest.Mock).mockResolvedValueOnce({});

    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ message: "Name is required" });
  });

  it("should return 404 if user is not found", async () => {
    (req.json as jest.Mock).mockResolvedValueOnce({
      name: "New Organization",
    });
    (prismaClientMock.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const res = await POST(req);

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ message: "User not found" });
  });

  it("should return 400 if organization name already exists", async () => {
    (req.json as jest.Mock).mockResolvedValueOnce({
      name: "Existing Organization",
    });
    (prismaClientMock.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 1,
    });
    (
      prismaClientMock.organization.findUnique as jest.Mock
    ).mockResolvedValueOnce({
      name: "Existing Organization",
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ message: "Name exists" });
  });

  it("should create a new organization and return 200", async () => {
    (req.json as jest.Mock).mockResolvedValueOnce({
      name: "New Organization",
    });
    (prismaClientMock.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 1,
    });
    (
      prismaClientMock.organization.findUnique as jest.Mock
    ).mockResolvedValueOnce(null);
    prismaClientMock.organization.create.mockImplementationOnce(() =>
      Promise.resolve({
        id: 1,
        name: "New Organization",
      }),
    );

    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      message: "Success",
      organization: { id: 1, name: "New Organization" },
    });
  });
});

describe("GET /api/organizations", () => {
  let req: NextRequest;
  let session: Partial<Session> | null;

  beforeEach(() => {
    req = {
      url: "http://localhost:3000/api/organizations",
    } as unknown as NextRequest;

    session = {
      user: {
        id: "1",
        email: "test@example.com",
        isAdmin: false,
        username: "test",
      },
    };

    (getServerSession as jest.Mock).mockResolvedValue(session);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 if user is not authenticated", async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(null);
    const res = await GET(req);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "Unauthorized" });
  });

  it("should return 404 if user is not found", async () => {
    (prismaClientMock.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
    const res = await GET(req);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ message: "User not found" });
  });

  it("should return all organizations for a user when no id is provided", async () => {
    const mockUser = { id: 1, email: "test@example.com" };
    const mockOrganizations = [
      { id: "1", name: "Org 1" },
      { id: "2", name: "Org 2" },
    ];

    (prismaClientMock.user.findUnique as jest.Mock).mockResolvedValueOnce(
      mockUser,
    );
    (prismaClientMock.organization.findMany as jest.Mock).mockResolvedValueOnce(
      mockOrganizations,
    );

    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(mockOrganizations);
  });

  it("should return a specific organization when id is provided", async () => {
    const mockUser = { id: 1, email: "test@example.com" };
    const mockOrganization = {
      id: "1",
      name: "Org 1",
      tasks: [],
    };

    req = {
      url: "http://localhost:3000/api/organizations?id=1",
    } as unknown as NextRequest;

    (prismaClientMock.user.findUnique as jest.Mock).mockResolvedValueOnce(
      mockUser,
    );
    (
      prismaClientMock.organization.findFirst as jest.Mock
    ).mockResolvedValueOnce(mockOrganization);

    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(mockOrganization);
  });

  it("should return 404 when specific organization is not found", async () => {
    const mockUser = { id: 1, email: "test@example.com" };

    req = {
      url: "http://localhost:3000/api/organizations?id=999",
    } as unknown as NextRequest;

    (prismaClientMock.user.findUnique as jest.Mock).mockResolvedValueOnce(
      mockUser,
    );
    (
      prismaClientMock.organization.findFirst as jest.Mock
    ).mockResolvedValueOnce(null);

    const res = await GET(req);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ message: "Organization not found" });
  });

  it("should return 500 on internal server error", async () => {
    (prismaClientMock.user.findUnique as jest.Mock).mockRejectedValueOnce(
      new Error("Database error"),
    );

    const res = await GET(req);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: "Internal server error" });
  });
});
