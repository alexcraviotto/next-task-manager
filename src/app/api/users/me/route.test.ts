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
};
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => prismaClientMock),
}));
import { GET } from "./route";

describe("GET /api/users/me", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return user id when authenticated", async () => {
    const mockSession = {
      user: { email: "test@example.com" },
    };
    const mockUser = { id: 1 };

    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    prismaClientMock.user.findUnique.mockResolvedValue(mockUser);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockUser);
    expect(prismaClientMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: "test@example.com" },
      select: { id: true },
    });
  });

  it("should return 401 when not authenticated", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: "Unauthorized" });
    expect(prismaClientMock.user.findUnique).not.toHaveBeenCalled();
  });

  it("should return 404 when user not found", async () => {
    const mockSession = {
      user: { email: "test@example.com" },
    };

    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    prismaClientMock.user.findUnique.mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ error: "User not found" });
  });

  it("should return 500 on database error", async () => {
    const mockSession = {
      user: { email: "test@example.com" },
    };

    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    prismaClientMock.user.findUnique.mockRejectedValue(new Error("DB Error"));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "Internal error" });
  });
});
