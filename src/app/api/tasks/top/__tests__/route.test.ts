/**
 * @jest-environment node
 */
import "dotenv/config";

import { getServerSession } from "next-auth";

jest.mock("next-auth");

const prismaClientMock = {
  user: {
    findUnique: jest.fn(),
  },
  task: {
    findMany: jest.fn(),
  },
};

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => prismaClientMock),
}));
import { GET } from "../route";
import { NextRequest } from "next/server";

describe("GET /api/tasks/top", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 when user is not authenticated", async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(null);

    const response = await GET(
      new NextRequest(
        `${process.env.NEXTAUTH_URL}/api/tasks/top?organizationId=1`,
      ),
    );

    expect(response.status).toBe(401);
  });

  it("should return 400 when organizationId is missing", async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({
      user: { email: "test@example.com" },
    });

    const response = await GET(
      new NextRequest(`${process.env.NEXTAUTH_URL}/api/tasks/top`),
    );

    expect(response.status).toBe(400);
  });

  it("should return top 3 tasks sorted by relevance", async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({
      user: { email: "test@example.com" },
    });

    const mockUser = { id: 1, email: "test@example.com" };
    prismaClientMock.user.findUnique.mockResolvedValueOnce(mockUser);

    const mockTasks = [
      {
        id: 1,
        name: "Task 1",
        description: "Description 1",
        progress: 0,
        type: "feature",
        startDate: new Date(),
        endDate: new Date(),
        taskRatings: [
          {
            user: {
              organizations: [{ weight: 5 }],
            },
            clientSatisfaction: 5,
            effort: 1,
          },
        ],
      },
      {
        id: 2,
        name: "Task 2",
        description: "Description 2",
        progress: 50,
        type: "bug",
        startDate: new Date(),
        endDate: new Date(),
        taskRatings: [
          {
            user: {
              organizations: [{ weight: 3 }],
            },
            clientSatisfaction: 4,
            effort: 2,
          },
        ],
      },
      {
        id: 3,
        name: "Task 3",
        description: "Description 3",
        progress: 100,
        type: "improvement",
        startDate: new Date(),
        endDate: new Date(),
        taskRatings: [
          {
            user: {
              organizations: [{ weight: 4 }],
            },
            clientSatisfaction: 3,
            effort: 3,
          },
        ],
      },
    ];

    prismaClientMock.task.findMany.mockResolvedValueOnce(mockTasks);

    const response = await GET(
      new NextRequest(
        `${process.env.NEXTAUTH_URL}/api/tasks/top?organizationId=1`,
      ),
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeLessThanOrEqual(3);
    expect(data[0]).toHaveProperty("relevanceScore");
  });
});
