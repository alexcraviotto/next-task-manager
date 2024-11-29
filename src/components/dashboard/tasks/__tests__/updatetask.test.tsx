/* eslint-disable @typescript-eslint/ban-ts-comment */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { TaskTable } from "@/components/dashboard/tasks/TaskTable";
import { useTasks } from "@/hooks/useTasks";
import "@testing-library/jest-dom/vitest";
// Remove TasksPage import since we'll test TaskTable directly
// import TasksPage from "@/app/dashboard/organization/[uuid]/tasks/page";

// Mocks globales
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));
vi.mock("@/hooks/useTasks", () => ({
  useTasks: vi.fn(),
}));

describe("Task Creation and Listing Flow", () => {
  const mockRouter = { push: vi.fn() };

  beforeEach(() => {
    // Configurar mocks comunes
    // @ts-ignore
    (useSession as vi.Mock).mockReturnValue({
      data: { user: { username: "TestUser", isAdmin: true } },
    });
    // @ts-ignore
    (useRouter as vi.Mock).mockReturnValue(mockRouter);

    // Resetear fetch
    global.fetch = vi.fn();
  });
  it("modifies task weight and effort", async () => {
    // Mock initial task data
    const mockTask = {
      id: 1,
      name: "Test Task",
      description: "Test Description",
      type: "task",
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      progress: 5,
      weight: 0, // no permite valores cuando se crea
      effort: 0, // no permite valores cuando se crea
      organizationId: "1",
      dependencies: 0,
      createdAt: new Date().toISOString(),
    };

    // Configure fetch mock for update operation
    // @ts-ignore
    (global.fetch as vi.Mock).mockImplementation((url) => {
      if (url === `/api/tasks/${mockTask.id}`) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              ...mockTask,
              weight: 5,
              effort: 0,
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    // Mock useTasks to return initial and updated task
    // @ts-ignore
    (useTasks as vi.Mock)
      .mockReturnValueOnce({
        tasks: [mockTask],
        loading: false,
        error: null,
      })
      .mockReturnValueOnce({
        tasks: [
          {
            ...mockTask,
            weight: 3,
            effort: 2,
          },
        ],
        loading: false,
        error: null,
      });

    const updateTaskMock = vi.fn();

    // Render TaskTable with the mock task
    const { rerender } = render(
      <TaskTable
        projectId="1"
        tasks={[mockTask]}
        onAddTask={async (task) => ({ ...task, id: 1 })}
        onUpdateTask={updateTaskMock}
        onDeleteTask={async () => {}}
      />,
    );
    // Se ve la tarea
    await waitFor(() => {
      const nombre = screen.getByText("Test Task");
      const porc = screen.getByText("5%");
      // @ts-ignore
      expect(nombre).toBeInTheDocument();
      // @ts-ignore
      expect(porc).toBeInTheDocument();
    });
    // Find and click edit button
    const editButton = screen.getByRole("button", { name: "Editar tarea" });
    // @ts-ignore
    expect(editButton).toBeInTheDocument();
    await userEvent.click(editButton);

    // Dentro del formulario
    await waitFor(() => {
      const introPeso = screen.getByRole("spinbutton", { name: "Peso" });
      const botonGuardar = screen.getByRole("button", {
        name: "Guardar Cambios",
      });
      // @ts-ignore
      expect(introPeso).toBeInTheDocument();
      // @ts-ignore
      expect(botonGuardar).toBeInTheDocument();
    });

    // Find and fill weight and effort inputs
    const weightInput = screen.getByRole("spinbutton", { name: "Peso" });
    const effortInput = screen.getByRole("spinbutton", { name: "Esfuerzo" });
    const saveButton = screen.getByRole("button", { name: "Guardar Cambios" });

    await userEvent.clear(weightInput);
    await userEvent.type(weightInput, "3");
    await userEvent.clear(effortInput);
    await userEvent.type(effortInput, "2");
    await userEvent.click(saveButton);

    // Verify update function was called with correct parameters
    expect(updateTaskMock).toHaveBeenCalledWith(
      mockTask.id,
      expect.objectContaining({
        weight: 3,
        effort: 2,
      }),
    );

    // Rerender with updated task
    rerender(
      <TaskTable
        projectId="1"
        tasks={[
          {
            id: 1,
            name: "Test Task",
            description: "Test Description",
            type: "task",
            startDate: new Date().toISOString(),
            endDate: new Date().toISOString(),
            progress: 5,
            weight: 3,
            effort: 2,
            organizationId: "1",
            dependencies: 0,
            createdAt: new Date().toISOString(),
          },
        ]}
        onAddTask={async (task) => ({ ...task, id: 1 })}
        onUpdateTask={updateTaskMock}
        onDeleteTask={async () => {}}
      />,
    );

    // Verify updated values are displayed
    await waitFor(() => {
      // La tarea esta
      const nombre = screen.getByText("Test Task");
      const porc = screen.getByText("5%");
      // @ts-ignore
      expect(nombre).toBeInTheDocument();
      // @ts-ignore
      expect(porc).toBeInTheDocument();
      /*
      const weightCell = screen.getByText("3", { selector: "td" });
      const effortCell = screen.getByText("2", { selector: "td" });
      // @ts-ignore
      expect(weightCell).toBeInTheDocument();
      // @ts-ignore
      expect(effortCell).toBeInTheDocument();
      */
    });
  });
});
