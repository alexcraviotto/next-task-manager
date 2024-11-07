"use client";

import { useState } from "react";
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
import { ChevronDown, Plus, Search, Trash2 } from "lucide-react";

type Version = {
  id: number;
  name: string;
  tasks: number;
  date: Date;
};

export default function VersionsBoard({ projectId }: { projectId: string }) {
  console.log(projectId);
  const [versions, setVersions] = useState<Version[]>([
    { id: 1, name: "Versión 1", tasks: 1, date: new Date(2023, 0, 15) },
    { id: 2, name: "Versión 2", tasks: 1, date: new Date(2023, 1, 20) },
  ]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchDate, setSearchDate] = useState<Date | undefined>(undefined);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewTasksModalOpen, setIsViewTasksModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newVersionName, setNewVersionName] = useState("");
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);

  const handleAddVersion = () => {
    if (newVersionName.trim()) {
      const newVersion = {
        id: versions.length + 1,
        name: newVersionName,
        tasks: 0,
        date: new Date(),
      };
      setVersions((prevVersions) => [...prevVersions, newVersion]);
      setNewVersionName("");
      setIsAddModalOpen(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setSearchDate(undefined);
  };

  const handleViewTasks = (version: Version) => {
    setSelectedVersion(version);
    setIsViewTasksModalOpen(true);
  };

  const handleDeleteVersion = (version: Version) => {
    setSelectedVersion(version);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteVersion = () => {
    if (selectedVersion) {
      setVersions((prevVersions) =>
        prevVersions.filter((v) => v.id !== selectedVersion.id),
      );
      setIsDeleteModalOpen(false);
      setSelectedVersion(null);
    }
  };

  const filteredVersions = versions.filter(
    (version) =>
      (version.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        version.date.toLocaleDateString().includes(searchTerm)) &&
      (!searchDate ||
        version.date.toDateString() === searchDate.toDateString()),
  );

  return (
    <div className="mt-12 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex space-x-4">
          <div className="relative flex-grow">
            <Input
              placeholder="Buscar por nombre o fecha"
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
                    {version.name}
                    <Badge variant="secondary">
                      {version.tasks} tarea{version.tasks !== 1 && "s"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    Fecha: {version.date.toLocaleDateString()}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    className="flex-1 mr-2 bg-black/70"
                    onClick={() => handleViewTasks(version)}
                  >
                    Ver tareas
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    className="opacity-90"
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDeleteVersion(version)}
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
            <DialogTitle>{selectedVersion?.name} - Tareas</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedVersion?.tasks === 0 ? (
              <p>No hay tareas para esta versión.</p>
            ) : (
              <p>Tareas de la version: {selectedVersion?.name}.</p>
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
              ¿Estás seguro de que quieres eliminar la versión:
              {selectedVersion?.name}? Esta acción no se puede deshacer.
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
    </div>
  );
}
