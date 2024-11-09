"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ChevronDown, Plus, Search, Trash2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type VersionTask = {
  taskId: number;
  Task: {
    id: number;
    name: string;
    description: string;
    progress: number;
  };
};

type Version = {
  id: number;
  versionName: string;
  organizationId: number;
  createdAt: Date;
  versionTasks: VersionTask[];
};

export default function VersionsBoard({
  organizationId,
}: {
  organizationId: string;
}) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewTasksModalOpen, setIsViewTasksModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [newVersionName, setNewVersionName] = useState("");
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchVersions();
  }, [organizationId]);

  const fetchVersions = async () => {
    try {
      const response = await fetch(`/api/versions/${organizationId}`);
      if (response.ok) {
        const data = await response.json();
        setVersions(data.versions);
      }
    } catch (error) {
      console.error("Error fetching versions:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las versiones",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddVersion = async () => {
    if (newVersionName.trim()) {
      try {
        const response = await fetch("/api/versions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            organizationId: organizationId,
            versionName: newVersionName,
          }),
        });

        if (response.ok) {
          await fetchVersions();
          setNewVersionName("");
          setIsAddModalOpen(false);
          toast({
            title: "Éxito",
            description: "Versión creada correctamente",
          });
        }
      } catch (error) {
        console.error("Error creating version:", error);
        toast({
          title: "Error",
          description: "No se pudo crear la versión",
          variant: "destructive",
        });
      }
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  const handleViewTasks = (version: Version) => {
    setSelectedVersion(version);
    setIsViewTasksModalOpen(true);
  };

  const handleDeleteClick = (version: Version) => {
    setSelectedVersion(version);
    setIsDeleteModalOpen(true);
  };

  const handleApplyClick = (version: Version) => {
    setSelectedVersion(version);
    setIsApplyModalOpen(true);
  };

  const confirmDeleteVersion = async () => {
    if (selectedVersion) {
      try {
        const response = await fetch(`/api/versions/${selectedVersion.id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          await fetchVersions();
          setIsDeleteModalOpen(false);
          setSelectedVersion(null);
          toast({
            title: "Éxito",
            description: "Versión eliminada correctamente",
          });
        }
      } catch (error) {
        console.error("Error deleting version:", error);
        toast({
          title: "Error",
          description: "No se pudo eliminar la versión",
          variant: "destructive",
        });
      }
    }
  };

  const confirmApplyVersion = async () => {
    if (selectedVersion) {
      setIsApplying(true);
      try {
        const response = await fetch(`/api/versions/${selectedVersion.id}`, {
          method: "POST",
        });

        if (response.ok) {
          const updatedVersions = versions.filter(
            (v) =>
              v.id !== selectedVersion.id &&
              v.versionTasks.every(
                (vt) =>
                  vt.taskId <=
                  Math.max(
                    ...selectedVersion.versionTasks.map((t) => t.taskId),
                  ),
              ),
          );
          setVersions(updatedVersions);
          setIsApplyModalOpen(false);
          setSelectedVersion(null);
          toast({
            title: "Éxito",
            description: "Versión aplicada correctamente",
          });
        }
      } catch (error) {
        console.error("Error applying version:", error);
        toast({
          title: "Error",
          description: "No se pudo aplicar la versión",
          variant: "destructive",
        });
      } finally {
        setIsApplying(false);
      }
    }
  };

  const filteredVersions = versions.filter((version) =>
    version.versionName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className="mt-12 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, index) => (
              <Card key={index} className="bg-white shadow-md">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
                <CardFooter className="flex flex-wrap gap-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-10" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)]">
        <h2 className="text-2xl font-semibold mb-4">
          No hay versiones disponibles
        </h2>
        <p className="text-gray-500 mb-6">
          Crea una nueva versión para empezar
        </p>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Añadir versión
        </Button>

        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Añadir nueva versión</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nombre
                </Label>
                <Input
                  id="name"
                  value={newVersionName}
                  onChange={(e) => setNewVersionName(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleAddVersion}
                disabled={!newVersionName.trim()}
              >
                Añadir versión
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="mt-12 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="relative flex-grow">
            <Input
              placeholder="Buscar por nombre"
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>

          <Button onClick={handleClearSearch} variant="outline">
            Limpiar búsqueda
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Añadir versión
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredVersions.map((version) => (
              <Card
                key={version.id}
                className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300"
              >
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    {version.versionName}
                    <Badge variant="secondary">
                      {version.versionTasks?.length || 0} tareas
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    Fecha: {new Date(version.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
                <CardFooter className="flex flex-wrap gap-2">
                  <Button
                    className="flex-1 bg-black/70 hover:bg-black/80"
                    onClick={() => handleViewTasks(version)}
                  >
                    Ver tareas
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleApplyClick(version)}
                  >
                    Aplicar
                    <Check className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    className="opacity-90"
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDeleteClick(version)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir nueva versión</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nombre
              </Label>
              <Input
                id="name"
                value={newVersionName}
                onChange={(e) => setNewVersionName(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleAddVersion}
              disabled={!newVersionName.trim()}
            >
              Añadir versión
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isViewTasksModalOpen}
        onOpenChange={setIsViewTasksModalOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedVersion?.versionName} </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedVersion?.versionTasks.length === 0 ? (
              <p>No hay tareas para esta versión.</p>
            ) : (
              <div className="space-y-2">
                {selectedVersion?.versionTasks.map(
                  (versionTask: VersionTask) => (
                    <div
                      key={versionTask.taskId}
                      className="flex justify-between items-center py-2 px-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{versionTask.Task.name}</p>
                        <p className="text-sm text-gray-500">
                          {versionTask.Task.description}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {Math.round(versionTask.Task.progress)}%
                      </Badge>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsViewTasksModalOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar la versión:{" "}
              {selectedVersion?.versionName}? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDeleteVersion}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isApplyModalOpen} onOpenChange={setIsApplyModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar aplicación de versión</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres aplicar la versión:{" "}
              {selectedVersion?.versionName}? Esta acción actualizará las tareas
              de la organización.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsApplyModalOpen(false)}
              disabled={isApplying}
            >
              Cancelar
            </Button>
            <Button onClick={confirmApplyVersion} disabled={isApplying}>
              {isApplying ? "Aplicando..." : "Aplicar versión"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
