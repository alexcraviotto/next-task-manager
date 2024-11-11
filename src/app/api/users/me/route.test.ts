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
  // Agregar esto al inicio
  const originalError = console.error;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mockear console.error antes de cada test
    console.error = jest.fn();
  });

  afterEach(() => {
    // Restaurar console.error después de cada test
    console.error = originalError;
  });

  // ... resto de los tests ...

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
    // Opcionalmente, podemos verificar que console.error fue llamado
    expect(console.error).toHaveBeenCalled();
  });
});
