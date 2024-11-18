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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown } from "lucide-react";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";

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

  // Modifica el useEffect para cargar los ratings iniciales
  useEffect(() => {
    tasks.forEach((task) => {
      loadTaskRatings(task.id);
    });
  }, [tasks]);

  //
  const handleAddTask = () => {
    const today = new Date().toISOString();
    const newTask: Omit<Task, "id" | "createdAt"> = {
      name: "",
      description: "",
      type: "task",
      startDate: today,
      endDate: today,
      progress: 0,
      dependencies: 0,
      weight: 0,
      organizationId: projectId,
      effort: 0,
    };
    setEditingTask(newTask as Task);
    setIsDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
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

  const handleSaveTask = async () => {
    if (!editingTask) return;

    // Validar fechas antes de guardar
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

    try {
      let updatedTask;
      if ("id" in editingTask) {
        updatedTask = await onUpdateTask(editingTask.id, editingTask);

        // Crear objeto de actualización con valores seguros
        const updateData = {
          organizationId: projectId,
          effort: editingTask.effort ?? 0,
          clientWeight: editingTask.weight ?? 0, // Usar 0 si weight es undefined
        };

        console.log("Valores a enviar:", updateData);

        await updateTaskRating(editingTask.id, updateData);

        // Recargar los ratings después de actualizar
        await loadTaskRatings(editingTask.id);

        toast({
          title: "Tarea actualizada",
          description: "La tarea se ha actualizado correctamente",
        });
      } else {
        // Si es una nueva tarea
        updatedTask = await onAddTask(editingTask);
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

  const [sortBy, setSortBy] = useState<
    "satisfaction" | "effort" | "weight" | "none" | null
  >("none");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const getSortedTasks = () => {
    if (!sortBy || sortBy === "none") return tasks;

    return [...tasks]
      .sort((a, b) => {
        const aRating = taskRatings[a.id] || {
          clientSatisfaction: 0,
          effort: 0,
          clientWeight: 0,
        };
        const bRating = taskRatings[b.id] || {
          clientSatisfaction: 0,
          effort: 0,
          clientWeight: 0,
        };

        let aValue = 0;
        let bValue = 0;

        switch (sortBy) {
          case "satisfaction":
            aValue = aRating.clientSatisfaction;
            bValue = bRating.clientSatisfaction;
            break;
          case "effort":
            aValue = aRating.effort;
            bValue = bRating.effort;
            break;
          case "weight":
            aValue = aRating.clientWeight;
            bValue = bRating.clientWeight;
            break;
        }

        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      })
      .slice(0, 3); // Solo retorna los primeros 3 elementos cuando hay ordenamiento activo
  };

  const handleSort = (type: "satisfaction" | "effort" | "weight") => {
    if (sortBy === type) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(type);
      setSortOrder("desc");
    }
  };

  return (
    <div className="w-full space-y-4 mt-10 relative">
      {session?.user?.isAdmin && (
        <div className="flex mb-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <ArrowUpDown className="h-4 w-4" />
                Ordenar por
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSortBy("none")}>
                Mostrar todos {sortBy === "none" && "✓"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort("satisfaction")}>
                Satisfacción{" "}
                {sortBy === "satisfaction" && (sortOrder === "asc" ? "↑" : "↓")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort("effort")}>
                Esfuerzo{" "}
                {sortBy === "effort" && (sortOrder === "asc" ? "↑" : "↓")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort("weight")}>
                Valoración{" "}
                {sortBy === "weight" && (sortOrder === "asc" ? "↑" : "↓")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
            {getSortedTasks().map((task) => (
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

      {session?.user?.isAdmin && (
        <Button variant="default" className="gap-2" onClick={handleAddTask}>
          <Plus className="h-4 w-4" />
          Agregar Tarea
        </Button>
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
                value={editingTask?.weight || 0}
                max={5}
                min={0}
                onChange={(e) =>
                  setEditingTask(
                    editingTask
                      ? {
                          ...editingTask,
                          weight: Math.min(
                            5,
                            Math.max(0, Number(e.target.value)),
                          ),
                        }
                      : null,
                  )
                }
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
                value={editingTask?.effort || 0}
                max={5}
                min={0}
                onChange={(e) =>
                  setEditingTask(
                    editingTask
                      ? {
                          ...editingTask,
                          effort: Math.min(
                            5,
                            Math.max(0, Number(e.target.value)),
                          ),
                        }
                      : null,
                  )
                }
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
