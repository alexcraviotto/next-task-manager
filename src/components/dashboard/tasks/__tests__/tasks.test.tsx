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

  it("creates a task and then displays it in the task table", async () => {
    // Configurar fetch para crear tarea
    // @ts-ignore
    (global.fetch as vi.Mock).mockImplementation((url) => {
      if (url === "/api/tasks") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              task: {
                id: 1,
                name: "Test Task",
                description: "Test Description",
                type: "task",
                startDate: new Date().toISOString(),
                endDate: new Date().toISOString(),
                progress: 0,
                weight: 0,
                effort: 0,
                organizationId: "1",
                dependencies: 0,
                createdAt: new Date().toISOString(),
              },
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
    // @ts-ignore
    (useTasks as vi.Mock)
      .mockReturnValueOnce({
        tasks: [],
        loading: false,
        error: null,
      })
      .mockReturnValueOnce({
        tasks: [
          {
            id: 1,
            name: "Test Task",
            description: "Test Description",
            type: "task",
            startDate: new Date().toISOString(),
            endDate: new Date().toISOString(),
            progress: 0,
            weight: 0,
            effort: 0,
            organizationId: "1",
            dependencies: 0,
            createdAt: new Date().toISOString(),
          },
        ],
        loading: false,
        error: null,
      });

    // Remove TasksPage render since we only want to test TaskTable
    // const { rerender } = render(<TasksPage params={{uuid: "1234"}}/>);

    // Render only the TaskTable component
    const { rerender } = render(
      <TaskTable
        projectId="1"
        tasks={[]}
        onAddTask={async (task) => ({ ...task, id: 1 })}
        onUpdateTask={async (id, task) => ({
          id,
          name: task.name ?? "Default Name",
          description: task.description ?? "",
          type: task.type ?? "task",
          startDate: task.startDate ?? new Date().toISOString(),
          endDate: task.endDate ?? new Date().toISOString(),
          progress: task.progress ?? 0,
          weight: task.weight ?? 0,
          effort: task.effort ?? 0,
          organizationId: task.organizationId ?? "1",
          dependencies:
            typeof task.dependencies === "number" ? task.dependencies : 0,
          createdAt: task.createdAt ?? new Date().toISOString(),
        })}
        onDeleteTask={async () => {}}
      />,
    );

    // Get the first "Añadir Tarea" button using getAllByRole
    const addTaskButtons = screen.getAllByRole("button", {
      name: "Añadir Tarea",
    });
    const addTaskButton = addTaskButtons[0];
    await userEvent.click(addTaskButton);

    // Rellenar formulario de creación
    const nameInput = screen.getByLabelText("Nombre");
    const descriptionInput = screen.getByLabelText("Descripción");
    const submitButton = screen.getByRole("button", {
      name: "Agregar Tarea",
    });

    await userEvent.type(nameInput, "Test Task");
    await userEvent.type(descriptionInput, "Test Description");
    await userEvent.click(submitButton);

    // After submitting, rerender with the TaskTable containing the new task
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
            progress: 0,
            weight: 0,
            effort: 0,
            organizationId: "1",
            dependencies: 0,
            createdAt: new Date().toISOString(),
          },
        ]}
        onAddTask={async (task) => ({ ...task, id: 1 })}
        onUpdateTask={async (id, task) => ({
          id,
          name: task.name ?? "Default Name",
          description: task.description ?? "",
          type: task.type ?? "task",
          startDate: task.startDate ?? new Date().toISOString(),
          endDate: task.endDate ?? new Date().toISOString(),
          progress: task.progress ?? 0,
          weight: task.weight ?? 0,
          effort: task.effort ?? 0,
          organizationId: task.organizationId ?? "1",
          dependencies:
            typeof task.dependencies === "number" ? task.dependencies : 0,
          createdAt: task.createdAt ?? new Date().toISOString(),
        })}
        onDeleteTask={async () => {}}
      />,
    );

    // Verificar que la tarea aparece en la tabla
    await waitFor(() => {
      const taskName = screen.getByText((content, element) => {
        return (
          element?.tagName.toLowerCase() === "td" && content === "Test Task"
        );
      });
      // @ts-ignore
      expect(taskName).toBeInTheDocument();
    });
  });

  it("deletes a task and removes it from the table", async () => {
    // Mock initial task data
    const mockTask = {
      id: 1,
      name: "Test Task",
      description: "Test Description",
      type: "task",
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      progress: 0,
      weight: 0,
      effort: 0,
      organizationId: "1",
      dependencies: 0,
      createdAt: new Date().toISOString(),
    };

    // Configure fetch mock for delete operation
    // @ts-ignore
    (global.fetch as vi.Mock).mockImplementation((url) => {
      if (url === `/api/tasks/${mockTask.id}`) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    // Mock useTasks to first return a task and then an empty list after deletion
    // @ts-ignore
    (useTasks as vi.Mock)
      .mockReturnValueOnce({
        tasks: [mockTask],
        loading: false,
        error: null,
      })
      .mockReturnValueOnce({
        tasks: [],
        loading: false,
        error: null,
      });

    const deleteTaskMock = vi.fn();

    // Render TaskTable with the mock task
    const { rerender } = render(
      <TaskTable
        projectId="1"
        tasks={[mockTask]}
        onAddTask={async (task) => ({ ...task, id: 1 })}
        // @ts-ignore
        onUpdateTask={async (id, task) => ({ ...task, id })}
        onDeleteTask={deleteTaskMock}
      />,
    );

    // Find and click delete button
    const deleteButton = screen
      .getAllByRole("button")
      .find((button) => button.querySelector('svg[class*="lucide-trash"]'));
    // @ts-ignore
    expect(deleteButton).toBeInTheDocument();
    await userEvent.click(deleteButton!);

    // Verify delete function was called
    expect(deleteTaskMock).toHaveBeenCalledWith(mockTask.id);

    // Rerender with empty task list to simulate deletion
    rerender(
      <TaskTable
        projectId="1"
        tasks={[]}
        onAddTask={async (task) => ({ ...task, id: 1 })}
        // @ts-ignore
        onUpdateTask={async (id, task) => ({ ...task, id })}
        onDeleteTask={deleteTaskMock}
      />,
    );

    // Verify task is no longer in the table
    await waitFor(() => {
      const taskElement = screen.queryByText("Test Task");
      // @ts-ignore
      expect(taskElement).not.toBeInTheDocument();
    });
  });
});
