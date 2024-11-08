"use client";

import { useState, useEffect } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
}

export function TaskTable({ projectId }: { projectId: string }) {
  console.log("🚀 ~ TaskTable ~ projectId:", projectId);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Hook para obtener las 3 tareas mas relevantes al cargar el componente
  useEffect(() => {
    const fetchRelevantTasks = async () => {
      try {
        const response = await fetch("/api/tasks/top");
        if (response.ok) {
          const data = await response.json();
          setTasks(data);
        } else {
          console.error("Error al obtener las tareas más relevantes");
        }
      } catch (error) {
        console.error("Error en la solicitud:", error);
      }
    };
    fetchRelevantTasks();
  }, [projectId]);

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  const handleUpdateTask = () => {
    if (editingTask) {
      setTasks(
        tasks.map((task) => (task.id === editingTask.id ? editingTask : task)),
      );
      setEditingTask(null);
      setIsDialogOpen(false);
    }
  };

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
    };
    setEditingTask(newTask);
    setIsDialogOpen(true);
  };

  const handleSaveTask = () => {
    if (editingTask) {
      if (editingTask.id > tasks.length) {
        setTasks([...tasks, editingTask]);
      } else {
        handleUpdateTask();
      }
      setEditingTask(null);
      setIsDialogOpen(false);
    }
  };

  return (
    <div className="w-full space-y-4 mt-10 relative">
      {/* Container con scroll horizontal mejorado */}
      <div className="border rounded-lg overflow-x-auto overscroll-x-contain touch-pan-x scrollbar-thin scrollbar-thumb-gray-300">
        {/* Grid container con ancho mínimo */}
        <div className="min-w-[320px] lg:w-full relative">
          <Table>
            <TableHeader>
              <TableRow className="divide-x divide-gray-200">
                {/* Columna fija izquierda */}
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
                {/* Columna fija derecha */}
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Indicadores de scroll */}
          {/* <div className="absolute left-0 top-0 h-full w-4 bg-gradient-to-r from-white to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 h-full w-4 bg-gradient-to-l from-white to-transparent pointer-events-none" /> */}
        </div>
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
