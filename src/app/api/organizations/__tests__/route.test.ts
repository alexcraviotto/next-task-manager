/**
 * @jest-environment node
 */

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

import "dotenv/config";
import { NextRequest } from "next/server";
import { GET, POST } from "../route";
import { getServerSession } from "next-auth/next";
import { Session } from "next-auth";

jest.mock("next-auth/next");

// Después, usa prismaClientMock en el mock
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => prismaClientMock),
}));

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
        name: "Test User",
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
    prismaClientMock.user.findUnique.mockResolvedValueOnce(null);

    const res = await POST(req);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ message: "User not found" });
  });

  it("should return 400 if organization name already exists", async () => {
    (req.json as jest.Mock).mockResolvedValueOnce({
      name: "Existing Organization",
    });
    prismaClientMock.user.findUnique.mockResolvedValueOnce({ id: 1 });
    prismaClientMock.organization.findUnique.mockResolvedValueOnce({
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
    prismaClientMock.user.findUnique.mockResolvedValueOnce({ id: 1 });
    prismaClientMock.organization.findUnique.mockResolvedValueOnce(null);
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
        name: "Test User",
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

  it("should return organization with calculated progress if valid id is provided", async () => {
    const mockUser = {
      id: 1,
      email: "test@example.com",
      username: "test",
    };

    const mockTasks = [
      {
        id: 1,
        name: "Test Task 1",
        progress: 100,
        createdBy: mockUser,
        taskRatings: [],
        dependencies: [],
        dependentOn: [],
      },
      {
        id: 2,
        name: "Test Task 2",
        progress: 50,
        createdBy: mockUser,
        taskRatings: [],
        dependencies: [],
        dependentOn: [],
      },
    ];

    const mockOrganization = {
      id: "org-123",
      name: "Test Org",
      tasks: mockTasks,
      users: [
        {
          User: mockUser,
        },
      ],
    };

    req = {
      url: "http://localhost:3000/api/organizations?id=org-123",
    } as unknown as NextRequest;

    prismaClientMock.user.findUnique.mockResolvedValueOnce(mockUser);
    prismaClientMock.organization.findFirst.mockResolvedValueOnce(
      mockOrganization,
    );

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveProperty("totalProgress");
    expect(data).toHaveProperty("totalTasks");
    expect(data).toHaveProperty("completedTasks");
    expect(data).toHaveProperty("inProgressTasks");
    expect(data).toHaveProperty("pendingTasks");
    expect(data.totalProgress).toBe(75);
    expect(data.totalTasks).toBe(2);
    expect(data.completedTasks).toBe(1);
    expect(data.inProgressTasks).toBe(1);
    expect(data.pendingTasks).toBe(0);
  });

  it("should return organizations with calculated progress when no id is provided", async () => {
    const mockUser = {
      id: 1,
      email: "test@example.com",
    };

    const mockOrganizations = [
      {
        id: "1",
        name: "Org 1",
        tasks: [{ progress: 100 }, { progress: 50 }],
      },
      {
        id: "2",
        name: "Org 2",
        tasks: [{ progress: 0 }, { progress: 100 }],
      },
    ];

    prismaClientMock.user.findUnique.mockResolvedValueOnce(mockUser);
    prismaClientMock.organization.findMany.mockResolvedValueOnce(
      mockOrganizations,
    );

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveLength(2);
    expect(data[0]).toHaveProperty("totalProgress");
    expect(data[0]).toHaveProperty("totalTasks");
    expect(data[0]).toHaveProperty("completedTasks");
    expect(data[0]).toHaveProperty("inProgressTasks");
    expect(data[0]).toHaveProperty("pendingTasks");

    expect(data[0].totalProgress).toBe(75);
    expect(data[0].totalTasks).toBe(2);
    expect(data[0].completedTasks).toBe(1);
    expect(data[0].inProgressTasks).toBe(1);
    expect(data[0].pendingTasks).toBe(0);

    expect(data[1].totalProgress).toBe(50);
    expect(data[1].totalTasks).toBe(2);
    expect(data[1].completedTasks).toBe(1);
    expect(data[1].inProgressTasks).toBe(0);
    expect(data[1].pendingTasks).toBe(1);
  });

  it("should return 404 if organization is not found", async () => {
    const mockUser = {
      id: 1,
      email: "test@example.com",
    };

    req = {
      url: "http://localhost:3000/api/organizations?id=invalid-id",
    } as unknown as NextRequest;

    prismaClientMock.user.findUnique.mockResolvedValueOnce(mockUser);
    prismaClientMock.organization.findFirst.mockResolvedValueOnce(null);

    const res = await GET(req);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ message: "Organization not found" });
  });

  it("should return 404 if user is not found", async () => {
    prismaClientMock.user.findUnique.mockResolvedValueOnce(null);

    const res = await GET(req);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ message: "User not found" });
  });

  it("should return 500 on internal server error", async () => {
    prismaClientMock.user.findUnique.mockRejectedValueOnce(
      new Error("Database error"),
    );

    const res = await GET(req);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      message: "Internal server error",
    });
  });
});
