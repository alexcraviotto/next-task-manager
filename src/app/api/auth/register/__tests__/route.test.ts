/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";

const prismaClientMock = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => prismaClientMock),
}));

jest.mock("bcrypt", () => ({
  hash: jest.fn(() => Promise.resolve("hashedPassword123")),
}));

import { POST } from "../route";

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3001";

  it("should successfully create a new user", async () => {
    const userData = {
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    };

    prismaClientMock.user.findUnique.mockResolvedValueOnce(null);
    prismaClientMock.user.create.mockResolvedValueOnce({ id: 1, ...userData });

    const req = new Request(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    }) as unknown as NextRequest;

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toEqual({ message: "Created, welcome :)" });
  });

  it("should return 400 if required fields are missing", async () => {
    const userData = {
      username: "testuser",
      password: "password123",
    };

    const req = new Request(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    }) as unknown as NextRequest;

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ message: "Invalid parameters" });
    expect(prismaClientMock.user.findUnique).not.toHaveBeenCalled();
    expect(prismaClientMock.user.create).not.toHaveBeenCalled();
  });

  it("should return 400 if user already exists", async () => {
    const userData = {
      username: "existinguser",
      email: "existing@example.com",
      password: "password123",
    };

    prismaClientMock.user.findUnique.mockResolvedValueOnce({
      id: 1,
      ...userData,
    });

    const req = new Request(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    }) as unknown as NextRequest;

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ message: "User already exists" });
    expect(prismaClientMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: userData.email },
    });
    expect(prismaClientMock.user.create).not.toHaveBeenCalled();
  });

  it("should return 500 on internal server error", async () => {
    const userData = {
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    };

    prismaClientMock.user.findUnique.mockRejectedValueOnce(
      new Error("Database error"),
    );

    const req = new Request(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    }) as unknown as NextRequest;

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ message: "Internal Server Error" });
    expect(prismaClientMock.user.findUnique).toHaveBeenCalled();
  });
});
