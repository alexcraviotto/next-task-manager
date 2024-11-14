/**
 * @jest-environment node
 */
import "dotenv/config";

import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import nodemailer from "nodemailer";

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => prismaClientMock),
}));

jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("nodemailer", () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue("Email sent successfully"),
  }),
}));

const prismaClientMock = {
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
  },
  organization: {
    findUnique: jest.fn(),
  },
  userOrganization: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

import { GET, POST } from "../route";

describe("GET /api/organizations/[id]/invite", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "admin@example.com", isAdmin: true },
    });
  });

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3001";

  it("should return user information if found", async () => {
    const username = "testuser";
    const organizationId = "2";

    prismaClientMock.user.findFirst.mockResolvedValueOnce({
      id: 1,
      email: "user@example.com",
      username,
    });

    const req = new Request(
      `${baseUrl}/api/organizations/${organizationId}/invite?username=${username}`,
      {
        method: "GET",
      },
    ) as unknown as NextRequest;

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      id: 1,
      email: "user@example.com",
      username,
    });
    expect(prismaClientMock.user.findFirst).toHaveBeenCalledWith({
      where: { username },
      select: { id: true, email: true, username: true },
    });
  });

  it("should return 404 if user is not found", async () => {
    const username = "testuser";
    const organizationId = "2";

    prismaClientMock.user.findFirst.mockResolvedValueOnce(null);

    const req = new Request(
      `${baseUrl}/api/organizations/${organizationId}/invite?username=${username}`,
      {
        method: "GET",
      },
    ) as unknown as NextRequest;

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ message: "User not found" });
    expect(prismaClientMock.user.findFirst).toHaveBeenCalledWith({
      where: { username },
      select: { id: true, email: true, username: true },
    });
  });

  it("should return 400 if required parameters are missing", async () => {
    const req = new Request(`${baseUrl}/api/organizations/[id]/invite`, {
      method: "GET",
    }) as unknown as NextRequest;

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      message: "Username and organizationId are required",
    });
  });

  it("should return 401 if the user is not authenticated or not an admin", async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({
      user: { email: "user@example.com", isAdmin: false },
    });

    const req = new Request(`${baseUrl}/api/organizations/[id]/invite`, {
      method: "GET",
    }) as unknown as NextRequest;

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ message: "Unauthorized" });
  });

  it("should return 500 on internal server error", async () => {
    const username = "testuser";
    const organizationId = "2";

    prismaClientMock.user.findFirst.mockRejectedValueOnce(
      new Error("Database error"),
    );

    const req = new Request(
      `${baseUrl}/api/organizations/${organizationId}/invite?username=${username}`,
      {
        method: "GET",
      },
    ) as unknown as NextRequest;

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ message: "Internal Server Error" });
  });
});

describe("POST /api/organizations/[id]/invite", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "admin@example.com", isAdmin: true },
    });
  });

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3001";

  it("should successfully invite a user to an organization", async () => {
    const invitationData = {
      userId: 1,
      organizationId: 2,
    };

    prismaClientMock.user.findUnique.mockResolvedValueOnce({
      id: 1,
      email: "user@example.com",
      username: "testuser",
    });

    prismaClientMock.organization.findUnique.mockResolvedValueOnce({
      id: 2,
      name: "Test Organization",
    });

    prismaClientMock.userOrganization.findUnique.mockResolvedValueOnce(null);
    prismaClientMock.userOrganization.create.mockResolvedValueOnce({
      userId: 1,
      organizationId: 2,
    });

    const req = new Request(`${baseUrl}/api/organizations/[id]/invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(invitationData),
    }) as unknown as NextRequest;

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ message: "User invited successfully" });

    const transport = nodemailer.createTransport();
    expect(transport.sendMail).toHaveBeenCalledTimes(1);
    expect(transport.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "nexttaskmanager@gmail.com",
        to: "user@example.com",
        subject: "Invitación a unirte a la organización Test Organization",
        text: expect.stringContaining(
          'Hola testuser,\n\nTe hemos invitado a unirte a la organización "Test Organization". Por favor, introduce este id para entrar: 2',
        ),
      }),
    );
  });

  it("should return 400 if user is already a member of the organization", async () => {
    const invitationData = {
      userId: 1,
      organizationId: 2,
    };

    prismaClientMock.userOrganization.findUnique.mockResolvedValueOnce({
      userId: 1,
      organizationId: 2,
    });

    const req = new Request(`${baseUrl}/api/organizations/[id]/invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(invitationData),
    }) as unknown as NextRequest;

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      message: "El usuario ya pertenece a la organización",
    });
    expect(prismaClientMock.userOrganization.findUnique).toHaveBeenCalled();
    expect(nodemailer.createTransport().sendMail).not.toHaveBeenCalled();
  });

  it("should return 404 if user or organization is not found", async () => {
    const invitationData = {
      userId: 1,
      organizationId: 2,
    };

    prismaClientMock.user.findUnique.mockResolvedValueOnce(null);

    const req = new Request(`${baseUrl}/api/organizations/[id]/invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(invitationData),
    }) as unknown as NextRequest;

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ message: "User not found" });
    expect(nodemailer.createTransport().sendMail).not.toHaveBeenCalled();
  });

  it("should return 400 if required parameters are missing", async () => {
    const invitationData = {
      userId: null,
      organizationId: null,
    };

    const req = new Request(`${baseUrl}/api/organizations/[id]/invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(invitationData),
    }) as unknown as NextRequest;

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ message: "Invalid parameters" });
  });

  it("should return 401 if the user is not authenticated or not an admin", async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({
      user: { email: "user@example.com", isAdmin: false },
    });

    const invitationData = {
      userId: 1,
      organizationId: 2,
    };

    const req = new Request(`${baseUrl}/api/organizations/[id]/invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(invitationData),
    }) as unknown as NextRequest;

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ message: "Unauthorized" });
  });

  it("should return 500 on internal server error", async () => {
    const invitationData = {
      userId: 1,
      organizationId: 2,
    };

    prismaClientMock.user.findUnique.mockRejectedValueOnce(
      new Error("Database error"),
    );

    const req = new Request(`${baseUrl}/api/organizations/[id]/invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(invitationData),
    }) as unknown as NextRequest;

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ message: "Internal Server Error" });
  });
});
