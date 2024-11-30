/* eslint-disable @typescript-eslint/ban-ts-comment */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useOrganizations } from "@/hooks/use-organizations";
import OrganizationsPage from "@/app/dashboard/organization/page";
import CreateOrganization from "../createOrganization";
import "@testing-library/jest-dom/vitest";
// Mocks globales
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));
vi.mock("@/hooks/use-organizations", () => ({
  useOrganizations: vi.fn(),
}));
describe("Organization Creation and Listing Flow", () => {
  const mockRouter = { push: vi.fn() };
  beforeEach(() => {
    // Configurar mocks comunes
    // @ts-ignore
    (useSession as vi.Mock).mockReturnValue({
      data: { user: { username: "TestUser" } },
    });
    // @ts-ignore
    (useRouter as vi.Mock).mockReturnValue(mockRouter);

    // Resetear fetch
    global.fetch = vi.fn();
  });
  it("creates an organization and then displays it in the organizations page", async () => {
    // Configurar fetch para crear organización
    // @ts-ignore
    (global.fetch as vi.Mock).mockImplementation((url) => {
      if (url === "/api/organizations") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              organization: {
                id: "org123",
                name: "Test Organization",
                createdById: 1,
              },
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
    // Configurar hook de organizaciones para reflejar la nueva org
    // @ts-ignore
    (useOrganizations as vi.Mock)
      .mockReturnValueOnce({
        organizations: [],
        loading: false,
        error: null,
      })
      .mockReturnValueOnce({
        organizations: [
          {
            id: "org123",
            name: "Test Organization",
          },
        ],
        loading: false,
        error: null,
      });
    // Renderizar la página de organizaciones
    const { rerender } = render(<OrganizationsPage />);
    // Simular creación de organización
    const createOrgModal = render(
      <CreateOrganization
        isOpen={true}
        onClose={() => {}}
        onSuccess={() => {}}
      />,
    );
    // Rellenar formulario de creación
    const nameInput = createOrgModal.getByPlaceholderText(
      "Introduzca el nombre de la organización",
    );
    const effortLimitInput = createOrgModal.getByLabelText("Esfuerzo Límite:");
    const submitButton = createOrgModal.getByRole("button", {
      name: /Crear organización/i,
    });
    await userEvent.type(nameInput, "Test Organization");
    await userEvent.type(effortLimitInput, "10");
    await userEvent.click(submitButton);
    // Volver a renderizar la página de organizaciones
    rerender(<OrganizationsPage />);
    // Verificar que la organización aparece en la lista
    await waitFor(() => {
      const orgButton = screen.getByText("Test Organization");
      // @ts-ignore
      expect(orgButton).toBeInTheDocument();
    });
    // Verificar que se puede navegar a la organización
    const orgButton = screen.getByText("Test Organization");
    await userEvent.click(orgButton);

    expect(mockRouter.push).toHaveBeenCalledWith(
      "/dashboard/organization/org123",
    );
  });
});
