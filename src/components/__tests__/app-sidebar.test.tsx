import { vi } from "vitest";
import { useSession } from "next-auth/react";
import { render, screen } from "@testing-library/react";
import { AppSidebar } from "../app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import userEvent from "@testing-library/user-event";
import { useOrganizations } from "@/hooks/use-organizations";
import { useRouter } from "next/navigation";

// Mocks globales
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
}));

vi.mock("@/hooks/use-organizations", () => ({
  useOrganizations: vi.fn(),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: () => "/dashboard",
}));

describe("AppSidebar - Delete Organization", () => {
  beforeAll(() => {
    // Mock window.matchMedia
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // Deprecated
        removeListener: vi.fn(), // Deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it("deletes organization when delete button is clicked", async () => {
    const mockRouter = { push: vi.fn() };
    const mockRemoveOrganization = vi.fn();

    // Mock useSession
    // @ts-ignore
    useSession.mockReturnValue({
      data: { user: { id: 1 } },
    });

    // Mock useRouter
    // @ts-ignore
    useRouter.mockReturnValue(mockRouter);

    // Mock useOrganizations
    // @ts-ignore
    useOrganizations.mockReturnValue({
      organizations: [{ id: "org123", name: "Test Org", createdById: 1 }],
      loading: false,
      error: null,
      removeOrganization: mockRemoveOrganization,
    });

    // Mock fetch
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url === "/api/users/me") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: { id: 1 } }),
        });
      }
      if (url === "/api/organizations/org123") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: "Organization deleted" }),
        });
      }
      return Promise.resolve({ ok: true });
    });

    render(
      <SidebarProvider>
        <AppSidebar projectId="org123" />
      </SidebarProvider>,
    );

    // Click en la organización y botón de eliminar
    await userEvent.click(screen.getByText("Test Org"));
    await userEvent.click(screen.getByTestId("delete-org-button"));
    await userEvent.click(screen.getByRole("button", { name: /eliminar/i }));

    // Verificar que se llamó a la API y se actualizó el estado
    expect(global.fetch).toHaveBeenCalledWith("/api/organizations/org123", {
      method: "DELETE",
    });
    expect(mockRemoveOrganization).toHaveBeenCalledWith("org123");
    expect(mockRouter.push).toHaveBeenCalledWith("/dashboard");
  });
});
