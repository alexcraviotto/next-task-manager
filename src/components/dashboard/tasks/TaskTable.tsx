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
import { Pencil, Plus, Save } from "lucide-react";
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

export function TaskTable({ projectId }: { projectId: string }) {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  console.log(projectId);
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      name: "GestionarTarea1",
      description: "",
      type: "task",
      startDate: "19/10/2024",
      endDate: "20/10/2024",
      progress: 0,
      dependencies: 0,
      weight: 0,
      organizationId: projectId,
    },
    {
      id: 2,
      name: "NuevaTareaNueva",
      description: "",
      type: "task",
      startDate: "19/10/2024",
      endDate: "20/10/2024",
      progress: 0,
      dependencies: 0,
      weight: 0,
      organizationId: projectId,
    },
  ]);

  const handleAddTask = () => {
    const newTask: Task = {
      id: tasks.length + 1,
      name: "",
      description: "",
      type: "task",
      startDate: "",
      endDate: "",
      progress: 0,
      dependencies: 0,
      weight: 0,
      organizationId: projectId,
    };
    console.log(projectId);
    setEditingTask(newTask);
    setIsDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  const handleSaveTask = async () => {
    if (editingTask) {
      try {
        const response =
          editingTask.id > tasks.length
            ? await fetch("/api/tasks", {
                method: "POST",
                body: JSON.stringify(editingTask),
                headers: {
                  "Content-Type": "application/json",
                },
              })
            : await fetch(`/api/tasks/${editingTask.id}`, {
                method: "PUT",
                body: JSON.stringify(editingTask),
                headers: {
                  "Content-Type": "application/json",
                },
              });

        const data = await response.json();
        if (response.ok) {
          if (editingTask.id > tasks.length) {
            setTasks([...tasks, data.task]);
          } else {
            setTasks(
              tasks.map((task) =>
                task.id === editingTask.id ? data.task : task,
              ),
            );
          }
          setEditingTask(null);
          setIsDialogOpen(false);
        } else {
          console.error("Error saving task:", data.message);
        }
      } catch (error) {
        console.error("Error saving task:", error);
      }
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (response.ok) {
        setTasks(tasks.filter((task) => task.id !== taskId));
      } else {
        console.error("Error deleting task:", data.message);
      }
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

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
                Peso
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
                  {task.startDate}
                </TableCell>
                <TableCell className="p-2 sm:p-4 text-xs sm:text-sm">
                  {task.endDate}
                </TableCell>
                <TableCell className="p-2 sm:p-4 text-xs sm:text-sm text-center">
                  {task.progress}%
                </TableCell>
                <TableCell className="p-2 sm:p-4 text-xs sm:text-sm text-center">
                  {task.dependencies}
                </TableCell>
                <TableCell className="p-2 sm:p-4 text-xs sm:text-sm">
                  {task.weight}
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
                    <Save className="h-4 w-4" />
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
              {editingTask && editingTask.id <= tasks.length
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
                value={editingTask?.startDate || ""}
                onChange={(e) =>
                  setEditingTask(
                    editingTask
                      ? {
                          ...editingTask,
                          startDate: e.target.value,
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
                value={editingTask?.endDate || ""}
                onChange={(e) =>
                  setEditingTask(
                    editingTask
                      ? {
                          ...editingTask,
                          endDate: e.target.value,
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
