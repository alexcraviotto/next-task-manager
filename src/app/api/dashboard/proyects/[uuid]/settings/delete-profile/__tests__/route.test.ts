/**
 * @jest-environment node
 */

import { getServerSession } from "next-auth";

// Configuración de mocks
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/database", () => ({
  prisma: prismaClientMock,
}));

// Mock de Prisma
const prismaClientMock = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

import { DELETE } from "../route";

describe("DELETE /api/dashboard/proyects/1/settings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 if user is not authenticated", async () => {
    // Mock session as null (no authenticated user)
    (getServerSession as jest.Mock).mockResolvedValueOnce(null);

    const response = await DELETE();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: "Unauthorized" });
  });

  it("should successfully deactivate user account", async () => {
    // Mock authenticated session
    (getServerSession as jest.Mock).mockResolvedValueOnce({
      user: { email: "test@example.com" },
    });

    // Mock user found in database
    prismaClientMock.user.findUnique.mockResolvedValueOnce({
      id: 1,
      email: "test@example.com",
      isActive: true,
    });

    // Mock successful update
    prismaClientMock.user.update.mockResolvedValueOnce({
      id: 1,
      email: "test@example.com",
      isActive: false,
    });

    const response = await DELETE();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ message: "Account deactivated successfully" });

    // Verify prisma calls
    expect(prismaClientMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: "test@example.com" },
    });
    expect(prismaClientMock.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { isActive: false },
    });
  });

  it("should return 500 on database error", async () => {
    // Mock authenticated session
    (getServerSession as jest.Mock).mockResolvedValueOnce({
      user: { email: "test@example.com" },
    });

    // Mock user found
    prismaClientMock.user.findUnique.mockResolvedValueOnce({
      id: 1,
      email: "test@example.com",
    });

    // Mock database error
    prismaClientMock.user.update.mockRejectedValueOnce(
      new Error("Database error"),
    );

    const response = await DELETE();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "Failed to deactivate account" });
  });
});
