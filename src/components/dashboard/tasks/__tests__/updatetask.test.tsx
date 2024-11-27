/* eslint-disable @typescript-eslint/ban-ts-comment */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { SessionProvider } from "next-auth/react"; // Importar SessionProvider
import { useRouter } from "next/navigation";
import { useTasks } from "@/hooks/useTasks";
import { TaskTable } from "../TaskTable";
import "@testing-library/jest-dom/vitest";

// Mocks globales
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

// Mock de useTasks correctamente
vi.mock("@/hooks/useTasks", () => ({
  useTasks: vi.fn(), // Asegúrate de que esto esté configurado correctamente
}));

describe("Task Modify Flow", () => {
  const mockRouter = { push: vi.fn() };

  beforeEach(() => {
    // Configurar mocks comunes
    // @ts-ignore
    (useRouter as vi.Mock).mockReturnValue(mockRouter);

    // Resetear fetch
    global.fetch = vi.fn();
  });

  it("modifies the weight and effort of a task successfully", async () => {
    // Configurar fetch para modificar la tarea
    // @ts-ignore
    (global.fetch as vi.Mock).mockImplementation((url, { method, body }) => {
      if (url === "/api/tasks/modify" && method === "POST") {
        const { weight, effort } = JSON.parse(body || "{}");
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              task: { id: "task123", weight, effort },
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    // Configurar hook de tareas para reflejar la tarea modificada
    // @ts-ignore
    (useTasks as vi.Mock)
      .mockReturnValueOnce({
        tasks: [
          {
            id: 123,
            weight: 5,
            effort: 20,
            name: "Task 123",
            description: "Sample task",
            type: "Type A",
            startDate: "",
            endDate: "",
            progress: 50,
            dependencies: 0,
            organizationId: "org1",
            createdAt: "",
          },
        ],
        loading: false,
        error: null,
      })
      .mockReturnValueOnce({
        tasks: [
          {
            id: 123,
            weight: 10,
            effort: 25,
            name: "Task 123",
            description: "Sample task",
            type: "Type A",
            startDate: "",
            endDate: "",
            progress: 50,
            dependencies: 0,
            organizationId: "org1",
            createdAt: "",
          },
        ],
        loading: false,
        error: null,
      });

    // Simulación de funciones que devuelven Promesas
    const onUpdateTask = vi.fn().mockResolvedValue({
      id: 123,
      weight: 10,
      effort: 25,
      name: "Task 123",
      description: "Sample task",
      type: "Type A",
      startDate: "",
      endDate: "",
      progress: 50,
      dependencies: 0,
      organizationId: "org1",
      createdAt: "",
    });

    const onDeleteTask = vi.fn().mockResolvedValue({
      id: 123,
      weight: 5,
      effort: 20,
      name: "Task 123",
      description: "Sample task",
      type: "Type A",
      startDate: "",
      endDate: "",
      progress: 50,
      dependencies: 0,
      organizationId: "org1",
      createdAt: "",
    });

    const onAddTask = vi.fn().mockResolvedValue({
      id: 124,
      weight: 5,
      effort: 20,
      name: "Task 124",
      description: "New task",
      type: "Type A",
      startDate: "",
      endDate: "",
      progress: 0,
      dependencies: 0,
      organizationId: "org1",
      createdAt: "",
    });

    // Renderizar la página de tarea envuelta en SessionProvider
    const { rerender } = render(
      <SessionProvider
        session={{
          user: {
            id: "user123",
            username: "TestUser",
            isAdmin: false,
            name: "Test User",
          },
          expires: new Date().toISOString(), // Agregar expires con la fecha actual en formato ISO
        }}
      >
        <TaskTable
          projectId="project123"
          tasks={[
            {
              id: 123,
              weight: 5,
              effort: 20,
              name: "Task 123",
              description: "Sample task",
              type: "Type A",
              startDate: "",
              endDate: "",
              progress: 50,
              dependencies: 0,
              organizationId: "org1",
              createdAt: "",
            },
          ]}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
          onAddTask={onAddTask}
        />
      </SessionProvider>,
    );

    // Simular clic en el botón de editar tarea
    const editButton = screen.getByRole("button", { name: /editar tarea/i });
    await userEvent.click(editButton);

    // Esperar que los campos de modificación aparezcan
    const weightInput = screen.getByLabelText("Peso");
    const effortInput = screen.getByLabelText("Esfuerzo");
    const submitButton = screen.getByRole("button", {
      name: /Guardar Cambios/i,
    });

    // Interactuar con los campos de formulario
    await userEvent.clear(weightInput);
    await userEvent.type(weightInput, "10");
    await userEvent.clear(effortInput);
    await userEvent.type(effortInput, "25");
    await userEvent.click(submitButton);

    // Volver a renderizar la página con los datos modificados
    rerender(
      <SessionProvider
        session={{
          user: {
            id: "user123",
            username: "TestUser",
            isAdmin: false,
            name: "Test User",
          },
          expires: new Date().toISOString(), // Agregar expires con la fecha actual en formato ISO
        }}
      >
        <TaskTable
          projectId="project123"
          tasks={[
            {
              id: 123,
              weight: 10, // Después de la modificación
              effort: 25, // Después de la modificación
              name: "Task 123",
              description: "Sample task",
              type: "Type A",
              startDate: "",
              endDate: "",
              progress: 50,
              dependencies: 0,
              organizationId: "org1",
              createdAt: "",
            },
          ]}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
          onAddTask={onAddTask}
        />
      </SessionProvider>,
    );

    // Verificar que la tarea muestra los nuevos valores de peso y esfuerzo
    await waitFor(() => {
      const weightCell = screen.getByText("5"); // Asegúrate de que el texto original (5) es único y accesible
      const effortCell = screen.getByText("20"); // Lo mismo para el valor de esfuerzo (20)

      // Verificar que los valores en las celdas han cambiado
      // @ts-ignore
      expect(weightCell).toHaveTextContent("10"); // Verificar que el valor de peso es 10 después de la modificación
      // @ts-ignore
      expect(effortCell).toHaveTextContent("25"); // Verificar que el valor de esfuerzo es 25 después de la modificación
    });

    // Verificar que se puede navegar a la página de tarea después de la modificación
    const taskButton = screen.getByText("Task 123");
    await userEvent.click(taskButton);

    expect(mockRouter.push).toHaveBeenCalledWith("/dashboard/task/123");
  });
});
