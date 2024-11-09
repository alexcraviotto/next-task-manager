/**
 * @jest-environment node
 */
import "dotenv/config";
import { getServerSession } from "next-auth";

jest.mock("next-auth");
const prismaClientMock = {
  organization: {
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
};
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => prismaClientMock),
}));
import { DELETE } from "./route";

describe("DELETE /api/organizations/[id]", () => {
  const mockSession = {
    user: { email: "test@example.com" },
  };
  const mockUser = { id: 1 };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should delete organization when user has permission", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    prismaClientMock.user.findUnique.mockResolvedValue(mockUser);
    prismaClientMock.organization.findUnique.mockResolvedValue({
      id: "123",
      createdById: 1,
    });
    prismaClientMock.organization.delete.mockResolvedValue({});

    const response = await DELETE(new Request("http://localhost"), {
      params: { id: "123" },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ message: "Organization deleted" });
    expect(prismaClientMock.organization.delete).toHaveBeenCalledWith({
      where: { id: "123" },
    });
  });

  it("should return 401 when user is not authenticated", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const response = await DELETE(new Request("http://localhost"), {
      params: { id: "123" },
    });

    expect(response.status).toBe(401);
    expect(prismaClientMock.organization.delete).not.toHaveBeenCalled();
  });

  it("should return 404 when organization not found", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    prismaClientMock.user.findUnique.mockResolvedValue(mockUser);
    prismaClientMock.organization.findUnique.mockResolvedValue(null);

    const response = await DELETE(new Request("http://localhost"), {
      params: { id: "123" },
    });

    expect(response.status).toBe(404);
    expect(prismaClientMock.organization.delete).not.toHaveBeenCalled();
  });

  it("should return 403 when user has no permission", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    prismaClientMock.user.findUnique.mockResolvedValue(mockUser);
    prismaClientMock.organization.findUnique.mockResolvedValue({
      id: "123",
      createdById: 2, // Diferente ID de usuario
    });

    const response = await DELETE(new Request("http://localhost"), {
      params: { id: "123" },
    });

    expect(response.status).toBe(403);
    expect(prismaClientMock.organization.delete).not.toHaveBeenCalled();
  });

  it("should return 500 on database error", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    prismaClientMock.user.findUnique.mockRejectedValue(new Error("DB Error"));

    const response = await DELETE(new Request("http://localhost"), {
      params: { id: "123" },
    });

    expect(response.status).toBe(500);
    expect(prismaClientMock.organization.delete).not.toHaveBeenCalled();
  });
});
