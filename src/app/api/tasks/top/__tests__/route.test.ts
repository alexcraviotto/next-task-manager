/**
 * @jest-environment node
 */
import "dotenv/config";

import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";

const prismaClientMock = {
  user: {
    findUnique: jest.fn(),
  },
  taskRating: {
    groupBy: jest.fn(),
  },
  task: {
    findMany: jest.fn(),
  },
};

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => prismaClientMock),
}));

jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

import { GET } from "../route";

describe("GET /api/organizations/{id}/tasks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3001";

  it("should successfully return top 3 tasks with highest client satisfaction", async () => {
    const sessionData = {
      user: { id: "1" },
    };
    const taskRatingsMock = [
      { taskId: 1, _avg: { clientSatisfaction: 5 } },
      { taskId: 2, _avg: { clientSatisfaction: 4 } },
      { taskId: 3, _avg: { clientSatisfaction: 3 } },
    ];
    const tasksMock = [
      { id: 1, name: "Task 1", taskRatings: [{ clientSatisfaction: 5 }] },
      { id: 2, name: "Task 2", taskRatings: [{ clientSatisfaction: 4 }] },
      { id: 3, name: "Task 3", taskRatings: [{ clientSatisfaction: 3 }] },
    ];

    prismaClientMock.taskRating.groupBy.mockResolvedValueOnce(taskRatingsMock);
    prismaClientMock.task.findMany.mockResolvedValueOnce(tasksMock);
    jest.mocked(getServerSession).mockResolvedValueOnce(sessionData);
    prismaClientMock.user.findUnique.mockResolvedValueOnce({ isAdmin: true });

    const req = new Request(
      `${baseUrl}/api/organizations/1/tasks?organizationId=1`,
      {
        method: "GET",
      },
    ) as unknown as NextRequest;

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(tasksMock);
  });

  it("should return 400 if organizationId is invalid", async () => {
    const req = new Request(
      `${baseUrl}/api/organizations/1/tasks?organizationId=0`,
      {
        method: "GET",
      },
    ) as unknown as NextRequest;

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: "Invalid organization ID" });
  });

  it("should return 401 if user is not authenticated", async () => {
    jest.mocked(getServerSession).mockResolvedValueOnce(null);

    const req = new Request(
      `${baseUrl}/api/organizations/1/tasks?organizationId=1`,
      {
        method: "GET",
      },
    ) as unknown as NextRequest;

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: "User not authenticated" });
  });

  it("should return 403 if user is not an admin", async () => {
    const sessionData = {
      user: { id: "1" },
    };

    jest.mocked(getServerSession).mockResolvedValueOnce(sessionData);
    prismaClientMock.user.findUnique.mockResolvedValueOnce({ isAdmin: false });

    const req = new Request(
      `${baseUrl}/api/organizations/1/tasks?organizationId=1`,
      {
        method: "GET",
      },
    ) as unknown as NextRequest;

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data).toEqual({ error: "Forbidden" });
  });

  it("should return 500 on internal server error", async () => {
    const sessionData = {
      user: { id: "1" },
    };

    jest.mocked(getServerSession).mockResolvedValueOnce(sessionData);
    prismaClientMock.user.findUnique.mockResolvedValueOnce({ isAdmin: true });
    prismaClientMock.taskRating.groupBy.mockRejectedValueOnce(
      new Error("Database error"),
    );

    const req = new Request(
      `${baseUrl}/api/organizations/1/tasks?organizationId=1`,
      {
        method: "GET",
      },
    ) as unknown as NextRequest;

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "Internal Server Error" });
  });
});
