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
    create: jest.fn(),
  },
};

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => prismaClientMock),
}));
import { POST } from "../route";
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
    (prismaClientMock.organization.create as jest.Mock).mockResolvedValueOnce({
      id: 1,
      name: "New Organization",
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      message: "Success",
      organization: { id: 1, name: "New Organization" },
    });
  });
});
