"use client";

import { useState } from "react";
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
import { useTasks } from "@/hooks/useTasks";
import { Loader2 } from "lucide-react";

interface Task {
  id: number;
  name: string;
  description: string;
  type: string;
  startDate: string;
  endDate: string;
  progress: number;
  dependencies: number;
  weight: number;
  organizationId: string;
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

export function TaskTable({ projectId }: { projectId: string }) {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { tasks, isLoading, error, addTask, updateTask, deleteTask } =
    useTasks(projectId);

  const handleAddTask = () => {
    const today = new Date().toISOString();
    const newTask: Omit<Task, "id"> = {
      name: "",
      description: "",
      type: "task",
      startDate: today,
      endDate: today,
      progress: 0,
      dependencies: 0,
      weight: 0,
      organizationId: projectId,
    };
    setEditingTask(newTask as Task);
    setIsDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  const handleSaveTask = async () => {
    if (!editingTask) return;

    try {
      if ("id" in editingTask) {
        await updateTask(editingTask.id, editingTask);
      } else {
        await addTask(editingTask);
      }
      setIsDialogOpen(false);
      setEditingTask(null);
    } catch (error) {
      console.error("Error saving task:", error);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await deleteTask(taskId);
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-48 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-4 text-center text-red-500">Error: {error}</div>
    );
  }

  return (
    <div className="w-full space-y-4 mt-10 relative">
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
              <TableHead className="p-2 sm:p-4 text-xs sm:text-sm text-center w-[100px]">
                Dependientes
              </TableHead>
              <TableHead className="p-2 sm:p-4 text-xs sm:text-sm w-[120px]">
                Satisfacción
              </TableHead>
              <TableHead className="p-2 sm:p-4 text-xs sm:text-sm w-[120px]">
                Valoracion
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
                <TableCell className="p-2 sm:p-4 text-xs sm:text-sm text-center">
                  {task.dependencies}
                </TableCell>
                <TableCell className="p-2 sm:p-4 text-xs sm:text-sm">
                  0
                </TableCell>
                <TableCell className="p-2 sm:p-4 text-xs sm:text-sm">
                  {task.weight ?? 0}
                </TableCell>
                <TableCell className="p-2 sm:p-4 text-xs sm:text-sm">
                  0
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
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteTask(task.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Eliminar tarea</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Button variant="default" className="gap-2" onClick={handleAddTask}>
        <Plus className="h-4 w-4" />
        Agregar Tarea
      </Button>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {(editingTask?.id ?? false)
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
                value={
                  editingTask ? formatDateForInput(editingTask.startDate) : ""
                }
                onChange={(e) =>
                  setEditingTask(
                    editingTask
                      ? {
                          ...editingTask,
                          startDate: parseInputDate(e.target.value),
                        }
                      : null,
                  )
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endDate" className="text-right">
                Fin
              </Label>
              <Input
                id="endDate"
                type="date"
                value={
                  editingTask ? formatDateForInput(editingTask.endDate) : ""
                }
                onChange={(e) =>
                  setEditingTask(
                    editingTask
                      ? {
                          ...editingTask,
                          endDate: parseInputDate(e.target.value),
                        }
                      : null,
                  )
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="progress" className="text-right">
                Progreso
              </Label>
              <Input
                id="progress"
                type="number"
                value={editingTask?.progress || 0}
                onChange={(e) =>
                  setEditingTask(
                    editingTask
                      ? {
                          ...editingTask,
                          progress: Number(e.target.value),
                        }
                      : null,
                  )
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
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
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="valoracion" className="text-right">
                Valoración
              </Label>
              <Input
                type="number"
                id="valoracion"
                value={editingTask?.weight || 0}
                max={5}
                min={0}
                onChange={(e) =>
                  setEditingTask(
                    editingTask
                      ? {
                          ...editingTask,
                          weight: Number(e.target.value),
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
            {editingTask && editingTask.id <= tasks.length
              ? "Guardar Cambios"
              : "Agregar Tarea"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
