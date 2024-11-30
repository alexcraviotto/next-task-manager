"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Plus, Save, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Task } from "@/lib/types";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import { calculations } from "@/lib/calculations";

interface TaskTableProps {
  projectId: string;
  tasks: Task[];
  onAddTask: (task: Omit<Task, "id">) => Promise<Task>;
  onUpdateTask: (id: number, task: Partial<Task>) => Promise<Task>;
  onDeleteTask: (id: number) => Promise<void>;
}

const formatDateForInput = (date: string): string => {
  if (!date) return "";

  try {
    const dateObj = new Date(date);
    return dateObj.toISOString().split("T")[0];
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
};

const parseInputDate = (dateString: string): string => {
  if (!dateString) return new Date().toISOString();
  return new Date(dateString).toISOString();
};

export function TaskTable({
  projectId,
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
}: TaskTableProps) {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();
  const { toast } = useToast();
  const [effortFilter, setEffortFilter] = useState(0);
  const [effortLimit, setEffortLimit] = useState(0);

  // TaskRating
  const [taskRatings, setTaskRatings] = useState<{
    [key: number]: {
      clientSatisfaction: number;
      clientWeight: number;
      effort: number;
    };
  }>({});

  const loadTaskRatings = async (taskId: number) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/rating`);
      if (!response.ok) throw new Error("Failed to fetch ratings");
      const data = await response.json();
      setTaskRatings((prev) => ({
        ...prev,
        [taskId]: data,
      }));
    } catch (error) {
      console.error("Error loading task ratings:", error);
    }
  };
  useEffect(() => {
    fetch(`/api/organizations/${projectId}`)
      .then((res) => res.json())
      .then((data) => setEffortLimit(data.effortLimit));
  }, []);
  // Modifica el useEffect para cargar los ratings iniciales
  useEffect(() => {
    tasks.forEach((task) => {
      loadTaskRatings(task.id);
    });
  }, [tasks]);

  //
  const handleAddTask = () => {
    const today = new Date();
    const startDate = today.toISOString();
    const endDate = new Date(today.setDate(today.getDate() + 1)).toISOString();
    const newTask: Omit<Task, "id"> = {
      name: "",
      description: "",
      type: "task",
      startDate: startDate,
      endDate: endDate,
      progress: 0,
      dependencies: 0,
      weight: 0,
      organizationId: projectId,
      effort: 0,
      createdAt: startDate,
    };
    setEditingTask(newTask as Task);
    setIsDialogOpen(true);
  };

  // Añadir un estado para mantener los valores editados
  const [editedValues, setEditedValues] = useState<{
    weight?: number;
    effort?: number;
  }>({});

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    // Resetear los valores editados cuando se abre el diálogo
    setEditedValues({
      weight: taskRatings[task.id]?.clientWeight ?? 0,
      effort: taskRatings[task.id]?.effort ?? 0,
    });
    setIsDialogOpen(true);
  };

  const updateTaskRating = async (
    taskId: number,
    data: { organizationId?: string; effort?: number; clientWeight?: number },
  ) => {
    setIsLoading(true);
    console.log("Loading: ", isLoading);
    setError(null);
    console.log("Error: ", error);

    console.log("organizationId: ", data.organizationId);
    console.log("effort: ", data.effort);
    console.log("clientWeight: ", data.clientWeight);
    try {
      const response = await fetch(`/api/tasks/${taskId}/feedback`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Error al actualizar la valoración");
      }
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Añadir validación de fechas
  const validateDates = (startDate: string, endDate: string): boolean => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    return end >= start;
  };

  // Modificar la validación en handleSaveTask
  const handleSaveTask = async () => {
    if (!editingTask) return;

    // Validar fechas
    if (!validateDates(editingTask.startDate, editingTask.endDate)) {
      setError(
        "La fecha de fin debe ser posterior o igual a la fecha de inicio",
      );
      toast({
        variant: "destructive",
        title: "Error",
        description:
          "La fecha de fin debe ser posterior o igual a la fecha de inicio",
      });
      return;
    }

    // Validar peso y esfuerzo
    if (
      editingTask.weight < 0 ||
      editingTask.weight > 5 ||
      editingTask.effort < 0 ||
      editingTask.effort > 5
    ) {
      setError("El peso y el esfuerzo deben estar entre 0 y 5");
      toast({
        variant: "destructive",
        title: "Error",
        description: "El peso y el esfuerzo deben estar entre 0 y 5",
      });
      return;
    }

    try {
      let updatedTask: Task;
      if ("id" in editingTask) {
        updatedTask = await onUpdateTask(editingTask.id, editingTask);

        // Crear objeto de actualización con valores seguros
        const updateData = {
          organizationId: projectId,
          effort: editedValues.effort ?? 0,
          clientWeight: editedValues.weight ?? 0, // Usar 0 si weight es undefined
        };

        console.log("Valores a enviar:", updateData);

        await updateTaskRating(editingTask.id, updateData);

        toast({
          title: "Tarea actualizada",
          description: "La tarea se ha actualizado correctamente",
        });
      } else {
        // Si es una nueva tarea

        updatedTask = await onAddTask(editingTask as Omit<Task, "id">);
        console.log(
          "🚀 ~ handleSaveTask ~ updatedTask:",
          JSON.stringify(updatedTask),
        );

        const updateData = {
          organizationId: projectId,
          effort: editedValues.effort ?? 0,
          clientWeight: editedValues.weight ?? 0, // Usar 0 si weight es undefined
        };
        await updateTaskRating(updatedTask.id, updateData);

        console.log("Tarea agregada:", updatedTask);
        toast({
          title: "Tarea creada",
          description: "La tarea se ha creado correctamente",
        });
      }
      setIsDialogOpen(false);
      setEditingTask(null);
    } catch (error) {
      console.error("Error saving task:", error);
      setError(
        error instanceof Error ? error.message : "Error al guardar la tarea",
      );
      toast({
        variant: "destructive",
        title: "Error",
        description:
          "No se pudo guardar la tarea. Por favor, inténtalo de nuevo.",
      });
    }
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (!isNaN(value)) {
      setEffortFilter(value);
    }
  };
  // Modificar el manejo de cambio de fechas
  const handleDateChange = (field: "startDate" | "endDate", value: string) => {
    if (!editingTask) return;

    const newDate = parseInputDate(value);
    const updatedTask = { ...editingTask };

    if (field === "startDate") {
      updatedTask.startDate = newDate;
      // Si la fecha de inicio es posterior a la de fin, actualizar la fecha de fin
      if (!validateDates(newDate, updatedTask.endDate)) {
        updatedTask.endDate = newDate;
      }
    } else {
      // Si la fecha de fin es anterior a la de inicio, no permitir el cambio
      if (!validateDates(updatedTask.startDate, newDate)) {
        return;
      }
      updatedTask.endDate = newDate;
    }

    setEditingTask(updatedTask);
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await onDeleteTask(taskId);
      toast({
        title: "Tarea eliminada",
        description: "La tarea se ha eliminado correctamente",
      });
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          "No se pudo eliminar la tarea. Por favor, inténtalo de nuevo.",
      });
    }
  };

  // Añadir nuevo estado para controlar la visibilidad de la solución
  const [showSolution, setShowSolution] = useState(false);

  // Añadir estado para métricas
  const [metrics, setMetrics] = useState<{
    totalSatisfaction: number;
    totalEffort: number;
    totalProductivity: number;
    coverage: number;
  }>({
    totalSatisfaction: 0,
    totalEffort: 0,
    totalProductivity: 0,
    coverage: 0,
  });

  // Calcular métricas cuando cambien las tareas o los ratings
  useEffect(() => {
    const tasksWithRatings = tasks.map((task) => ({
      id: task.id,
      name: task.name,
      ratings: taskRatings[task.id] || {
        clientSatisfaction: 0,
        clientWeight: 0,
        effort: 0,
      },
    }));

    const newMetrics = calculations.calculateGlobalMetrics(tasksWithRatings);
    setMetrics(newMetrics);
  }, [tasks, taskRatings]);

  return (
    <div className="w-full space-y-4 mt-10 relative">
      {session?.user?.isAdmin && (
        <div className="flex mb-4 justify-between mr-4 ">
          <div className="flex space-x-3 items-center">
            <label
              htmlFor="effort-input"
              className="block text-sm font-medium text-gray-700"
            >
              Esfuerzo:
            </label>
            <input
              id="effort-input"
              type="number"
              value={effortFilter}
              onChange={handleInputChange}
              min={0}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              placeholder="Introduce un valor"
            />
          </div>
        </div>
      )}
      <div className="border rounded-lg overflow-x-auto overscroll-x-contain touch-pan-x scrollbar-thin scrollbar-thumb-gray-300">
        <Table>
          <TableHeader>
            <TableRow className="divide-x divide-gray-200">
              <TableHead className="p-2 sm:p-4 text-xs sm:text-sm font-medium sticky left-0 bg-white z-20 w-[120px] sm:w-[150px]">
                Tareas
              </TableHead>
              <TableHead className="p-2 sm:p-4 text-xs sm:text-sm min-w-[150px]">
                Descripción
              </TableHead>
              <TableHead className="p-2 sm:p-4 text-xs sm:text-sm w-[100px]">
                Tipo
              </TableHead>
              <TableHead className="p-2 sm:p-4 text-xs sm:text-sm w-[100px]">
                Inicio
              </TableHead>
              <TableHead className="p-2 sm:p-4 text-xs sm:text-sm w-[100px]">
                Fin
              </TableHead>
              <TableHead className="p-2 sm:p-4 text-xs sm:text-sm text-center w-[90px]">
                Progreso
              </TableHead>
              {/*<TableHead className="p-2 sm:p-4 text-xs sm:text-sm text-center w-[100px]">
                Dependientes
              </TableHead>
              */}
              <TableHead className="p-2 sm:p-4 text-xs sm:text-sm w-[120px]">
                Satisfacción
              </TableHead>
              <TableHead className="p-2 sm:p-4 text-xs sm:text-sm w-[120px]">
                Valoración
              </TableHead>
              <TableHead className="p-2 sm:p-4 text-xs sm:text-sm w-[120px]">
                Esfuerzo
              </TableHead>
              <TableHead className="p-2 sm:p-4 text-xs sm:text-sm sticky right-0 bg-white z-20 w-[100px]">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id} className="divide-x divide-gray-200">
                <TableCell className="p-2 sm:p-4 text-xs sm:text-sm break-words sticky left-0 bg-white">
                  {task.name}
                </TableCell>
                <TableCell className="p-2 sm:p-4 text-xs sm:text-sm break-words">
                  {task.description}
                </TableCell>
                <TableCell className="p-2 sm:p-4 text-xs sm:text-sm">
                  {task.type}
                </TableCell>
                <TableCell className="p-2 sm:p-4 text-xs sm:text-sm">
                  {new Date(task.startDate).toLocaleDateString("es-ES")}
                </TableCell>
                <TableCell className="p-2 sm:p-4 text-xs sm:text-sm">
                  {new Date(task.endDate).toLocaleDateString("es-ES")}
                </TableCell>
                <TableCell className="p-2 sm:p-4 text-xs sm:text-sm text-center">
                  {task.progress}%
                </TableCell>
                {/*<TableCell className="p-2 sm:p-4 text-xs sm:text-sm text-center">
                  {task.dependencies}
                </TableCell>
                */}
                <TableCell className="p-2 sm:p-4 text-xs sm:text-sm">
                  {taskRatings[task.id]?.clientSatisfaction ?? 0}
                </TableCell>
                <TableCell className="p-2 sm:p-4 text-xs sm:text-sm">
                  {taskRatings[task.id]?.clientWeight ?? 0}
                </TableCell>
                <TableCell className="p-2 sm:p-4 text-xs sm:text-sm">
                  {taskRatings[task.id]?.effort ?? 0}
                </TableCell>
                <TableCell className="p-2 sm:p-4 text-xs sm:text-sm sticky right-0 bg-white">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditTask(task)}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Editar tarea</span>
                  </Button>
                  {session?.user?.isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Eliminar tarea</span>
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center mt-6">
        {session?.user?.isAdmin && (
          <Button variant="default" className="gap-2" onClick={handleAddTask}>
            <Plus className="h-4 w-4" />
            Añadir Tarea
          </Button>
        )}

        <Button
          variant="outline"
          onClick={() => setShowSolution(!showSolution)}
          className="ml-4"
        >
          {showSolution ? "Ocultar Solución" : "Ver Solución"}
        </Button>
      </div>

      {showSolution && (
        <div className="mt-8 space-y-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h2 className="text-2xl font-semibold mb-4">Análisis de Solución</h2>

          {/* Métricas principales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">
                Productividad Total
              </h3>
              <p className="text-2xl font-bold text-pink-600">
                {metrics.totalProductivity}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">
                Cobertura Cliente
              </h3>
              <p className="text-2xl font-bold text-pink-600">
                {(metrics.coverage * 100).toFixed(0)}%
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">
                Esfuerzo Total
              </h3>
              <p className="text-2xl font-bold text-pink-600">
                {metrics.totalEffort}/{effortLimit}
              </p>
            </div>
          </div>

          {/* Tabla de Análisis Detallado */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Requisito</TableHead>
                  <TableHead>Productividad</TableHead>
                  <TableHead>Contribución</TableHead>
                  <TableHead>Cobertura</TableHead>
                  <TableHead>Prioridad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks
                  .map((task) => ({
                    task,
                    rating: taskRatings[task.id] || {
                      clientSatisfaction: 0,
                      clientWeight: 0,
                      effort: 0,
                    },
                  }))
                  .sort(
                    (a, b) =>
                      b.rating.clientSatisfaction - a.rating.clientSatisfaction,
                  )
                  .map(({ task, rating }) => {
                    const productivity = calculations.calculateProductivity(
                      rating.clientSatisfaction,
                      rating.effort,
                    );

                    const contribution = calculations.calculateContribution(
                      rating.clientSatisfaction,
                      metrics.totalSatisfaction,
                    );

                    return (
                      <TableRow key={`solution-${task.id}`}>
                        <TableCell className="font-medium">
                          {task.name}
                          <span className="ml-2 text-xs text-gray-500">
                            (Satisfacción: {rating.clientSatisfaction})
                          </span>
                        </TableCell>
                        <TableCell>{productivity}</TableCell>
                        <TableCell>{contribution}</TableCell>
                        <TableCell>
                          {calculations.calculateCoverage(
                            rating.clientSatisfaction,
                            rating.clientWeight * 5,
                          )}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              productivity > 1
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {productivity > 1 ? "Alta" : "Media"}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>

          {/* Recomendaciones */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4">Recomendaciones</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="flex-shrink-0 h-5 w-5 text-green-500">✓</span>
                <span className="ml-2 text-sm text-gray-600">
                  Priorizar tareas con alta productividad y baja contribución
                </span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 h-5 w-5 text-yellow-500">!</span>
                <span className="ml-2 text-sm text-gray-600">
                  Revisar requisitos con baja cobertura
                </span>
              </li>
            </ul>
          </div>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {(editingTask?.id ?? null)
                ? "Editar Tarea"
                : "Agregar Nueva Tarea"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nombre
              </Label>
              <Input
                id="name"
                value={editingTask?.name || ""}
                disabled={!session?.user?.isAdmin}
                onChange={(e) =>
                  setEditingTask(
                    editingTask
                      ? {
                          ...editingTask,
                          name: e.target.value,
                        }
                      : null,
                  )
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Descripción
              </Label>
              <Input
                id="description"
                value={editingTask?.description || ""}
                disabled={!session?.user?.isAdmin}
                onChange={(e) =>
                  setEditingTask(
                    editingTask
                      ? {
                          ...editingTask,
                          description: e.target.value,
                        }
                      : null,
                  )
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Tipo
              </Label>
              <Select
                value={editingTask?.type || "task"}
                disabled={!session?.user?.isAdmin}
                onValueChange={(value) =>
                  setEditingTask(
                    editingTask ? { ...editingTask, type: value } : null,
                  )
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="task">Tarea</SelectItem>
                  <SelectItem value="milestone">Hito</SelectItem>
                  <SelectItem value="project">Proyecto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startDate" className="text-right">
                Inicio
              </Label>
              <Input
                id="startDate"
                type="date"
                disabled={!session?.user?.isAdmin}
                value={
                  editingTask ? formatDateForInput(editingTask.startDate) : ""
                }
                onChange={(e) => handleDateChange("startDate", e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endDate" className="text-right">
                Fin
              </Label>
              <Input
                disabled={!session?.user?.isAdmin}
                id="endDate"
                type="date"
                value={
                  editingTask ? formatDateForInput(editingTask.endDate) : ""
                }
                onChange={(e) => handleDateChange("endDate", e.target.value)}
                className="col-span-3"
                min={
                  editingTask ? formatDateForInput(editingTask.startDate) : ""
                }
              />
            </div>
            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="progress" className="text-right">
                Progreso
              </Label>
              <Input
                id="progress"
                disabled={!session?.user?.isAdmin}
                type="number"
                value={editingTask?.progress || 0}
                min={0}
                max={100}
                onChange={(e) =>
                  setEditingTask(
                    editingTask
                      ? {
                          ...editingTask,
                          progress: Math.min(
                            100,
                            Math.max(0, Number(e.target.value)),
                          ),
                        }
                      : null,
                  )
                }
                className="col-span-3"
              />
            </div>
            {/* <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dependencies" className="text-right">
                Dependientes
              </Label>
              <Input
                id="dependencies"
                type="number"
                value={editingTask?.dependencies || 0}
                onChange={(e) =>
                  setEditingTask(
                    editingTask
                      ? {
                          ...editingTask,
                          dependencies: Number(e.target.value),
                        }
                      : null,
                  )
                }
                className="col-span-3"
              />
            </div> */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="peso" className="text-right">
                Peso
              </Label>
              <Input
                type="number"
                id="peso"
                value={
                  editingTask?.id
                    ? editedValues.weight
                    : (editingTask?.weight ?? 0)
                }
                min={0}
                max={5}
                step={1}
                onChange={(e) => {
                  const value = Math.min(
                    5,
                    Math.max(0, Number(e.target.value)),
                  );
                  setEditedValues((prev) => ({
                    ...prev,
                    weight: value,
                  }));
                  setEditingTask(
                    editingTask
                      ? {
                          ...editingTask,
                          weight: value,
                        }
                      : null,
                  );
                }}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="esfuerzo" className="text-right">
                Esfuerzo
              </Label>
              <Input
                type="number"
                id="esfuerzo"
                value={
                  editingTask?.id
                    ? editedValues.effort
                    : (editingTask?.effort ?? 0)
                }
                min={0}
                max={5}
                step={1}
                onChange={(e) => {
                  const value = Math.min(
                    5,
                    Math.max(0, Number(e.target.value)),
                  );
                  setEditedValues((prev) => ({
                    ...prev,
                    effort: value,
                  }));
                  setEditingTask(
                    editingTask
                      ? {
                          ...editingTask,
                          effort: value,
                        }
                      : null,
                  );
                }}
                className="col-span-3"
              />
            </div>
          </div>
          <Button onClick={handleSaveTask} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {(editingTask?.id ?? null) ? "Guardar Cambios" : "Agregar Tarea"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
