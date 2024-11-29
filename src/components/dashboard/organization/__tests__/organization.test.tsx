/* eslint-disable @typescript-eslint/ban-ts-comment */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useOrganizations } from "@/hooks/use-organizations";
import { AppSidebar } from "../app-sidebar";
import "@testing-library/jest-dom/vitest";

// Mocks globales
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: () => "/dashboard",
}));

vi.mock("@/hooks/use-organizations", () => ({
  useOrganizations: vi.fn(),
}));

describe("AppSidebar - Delete Organization", () => {
  const mockRouter = { push: vi.fn() };
  const mockRemoveOrganization = vi.fn();
  const testOrg = { id: "org123", name: "Test Org", createdById: 1 };

  beforeEach(() => {
    // Configurar mocks comunes
    // @ts-ignore
    (useSession as vi.Mock).mockReturnValue({
      data: { user: { id: 1, email: "test@test.com" } },
    });

    // @ts-ignore
    (useRouter as vi.Mock).mockReturnValue(mockRouter);

    // @ts-ignore
    (useOrganizations as vi.Mock).mockReturnValue({
      organizations: [testOrg],
      loading: false,
      error: null,
      removeOrganization: mockRemoveOrganization,
    });

    // Resetear fetch
    global.fetch = vi.fn();
  });

  it("successfully deletes an organization", async () => {
    // Configurar fetch para eliminar organización
    // @ts-ignore
    (global.fetch as vi.Mock).mockImplementation((url) => {
      if (url === "/api/organizations/org123") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: "Organization deleted" }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ user: { id: 1 } }),
      });
    });

    render(<AppSidebar projectId="org123" />);

    // Simular proceso de eliminación
    await userEvent.click(screen.getByText("Test Org"));
    await userEvent.click(screen.getByRole("button", { name: /eliminar/i }));
    await userEvent.click(screen.getByRole("button", { name: /eliminar/i }));

    // Verificar que se eliminó correctamente
    await waitFor(() => {
      expect(mockRemoveOrganization).toHaveBeenCalledWith("org123");
      expect(mockRouter.push).toHaveBeenCalledWith("/dashboard");
    });
  });
});
