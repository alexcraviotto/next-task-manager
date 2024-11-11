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
import { Member } from "@/lib/types";

interface MembersTableProps {
  members: Member[];
  organizationId: number;
  onAddMember: (
    member: Omit<Member, "id" | "createdAt" | "updatedAt" | "email">,
  ) => Promise<void>;
  onUpdateMember: (id: number, member: Partial<Member>) => Promise<void>;
  onDeleteMember: (id: number) => Promise<void>;
}

interface UserInfo {
  id: number;
  email: string;
  username: string;
}

export function MembersTable({
  members,
  organizationId,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
}: MembersTableProps) {
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleEditMember = (member: Member) => {
    setEditingMember(member);
    setIsDialogOpen(true);
  };

  async function fetchUserByUsername(
    username: string,
  ): Promise<UserInfo | null> {
    try {
      // Verificar que organizationId esté correctamente definido
      if (!organizationId) {
        throw new Error("Organization ID is required");
      }

      const response = await fetch(
        `/api/organizations/${organizationId}/invite?username=${encodeURIComponent(username)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al buscar usuario");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching user info:", error);
      return null;
    }
  }

  const handleSaveMember = async () => {
    if (!editingMember) return;
    setIsLoading(true);

    try {
      if (editingMember.id === -1) {
        // Buscar usuario por username
        const userInfo = await fetchUserByUsername(editingMember.username);
        if (!userInfo) {
          throw new Error("Usuario no encontrado");
        }

        // Invitar usuario a la organización
        const response = await fetch(
          `/api/organizations/${organizationId}/invite`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: userInfo.id,
              organizationId: organizationId,
              weight: editingMember.weight,
            }),
          },
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Error al invitar al usuario");
        }

        // Actualizar la tabla local
        await onAddMember({
          username: userInfo.username,
          isAdmin: editingMember.isAdmin,
          weight: editingMember.weight,
        });
        console.log("Miembro agregado exitosamente");
      } else {
        await onUpdateMember(editingMember.id, editingMember);
        console.log("Miembro actualizado exitosamente");
      }

      setEditingMember(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving member:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMember = () => {
    const newMember: Member = {
      id: -1,
      username: "",
      email: "",
      isAdmin: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      weight: 0,
    };

    setEditingMember(newMember);
    setIsDialogOpen(true);
  };

  const handleDeleteMember = async (memberId: number) => {
    try {
      await onDeleteMember(memberId);
      console.log("Miembro eliminado exitosamente");
    } catch (error) {
      console.error("Error deleting member:", error);
    }
  };

  return (
    <div className="w-full space-y-4 mt-10 relative">
      <div className="border rounded-lg overflow-x-auto overscroll-x-contain touch-pan-x scrollbar-thin scrollbar-thumb-gray-300">
        <div className="min-w-[320px] lg:w-full relative">
          <Table>
            <TableHeader>
              <TableRow className="divide-x divide-gray-200">
                <TableHead className="p-2 sm:p-4 text-xs sm:text-sm font-medium sticky left-0 bg-white z-20 w-[150px]">
                  Usuario
                </TableHead>
                <TableHead className="p-2 sm:p-4 text-xs sm:text-sm w-[200px]">
                  Email
                </TableHead>
                <TableHead className="p-2 sm:p-4 text-xs sm:text-sm w-[100px] text-center">
                  Admin
                </TableHead>
                <TableHead className="p-2 sm:p-4 text-xs sm:text-sm w-[150px]">
                  Fecha Creación
                </TableHead>
                <TableHead className="p-2 sm:p-4 text-xs sm:text-sm w-[150px]">
                  Última Actualización
                </TableHead>
                <TableHead className="p-2 sm:p-4 text-xs sm:text-sm w-[150px]">
                  Peso
                </TableHead>
                <TableHead className="p-2 sm:p-4 text-xs sm:text-sm sticky right-0 bg-white z-20 w-[120px]">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id} className="divide-x divide-gray-200">
                  <TableCell className="p-2 sm:p-4 text-xs sm:text-sm break-words sticky left-0 bg-white">
                    {member.username}
                  </TableCell>
                  <TableCell className="p-2 sm:p-4 text-xs sm:text-sm break-words">
                    {member.email}
                  </TableCell>
                  <TableCell className="p-2 sm:p-4 text-xs sm:text-sm text-center">
                    {member.isAdmin ? "Sí" : "No"}
                  </TableCell>
                  <TableCell className="p-2 sm:p-4 text-xs sm:text-sm">
                    {new Date(member.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="p-2 sm:p-4 text-xs sm:text-sm">
                    {new Date(member.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="p-2 sm:p-4 text-xs sm:text-sm">
                    {member.weight}
                  </TableCell>
                  <TableCell className="p-2 sm:p-4 text-xs sm:text-sm sticky right-0 bg-white flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditMember(member)}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Editar miembro</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteMember(member.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Eliminar miembro</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <Button variant="default" className="gap-2" onClick={handleAddMember}>
        <Plus className="h-4 w-4" />
        Agregar Miembro
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingMember && editingMember.id <= members.length
                ? "Editar Miembro"
                : "Agregar Nuevo Miembro"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Usuario
              </Label>
              <Input
                id="username"
                value={editingMember?.username || ""}
                onChange={(e) =>
                  setEditingMember(
                    editingMember
                      ? {
                          ...editingMember,
                          username: e.target.value,
                        }
                      : null,
                  )
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isAdmin" className="text-right">
                Rol
              </Label>
              <Select
                value={editingMember?.isAdmin ? "admin" : "user"}
                onValueChange={(value) =>
                  setEditingMember(
                    editingMember
                      ? {
                          ...editingMember,
                          isAdmin: value === "admin",
                        }
                      : null,
                  )
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuario</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="weight" className="text-right">
                Peso
              </Label>
              <Input
                id="weight"
                type="number"
                value={editingMember?.weight || 0}
                min={0}
                max={5}
                onChange={(e) =>
                  setEditingMember(
                    editingMember
                      ? {
                          ...editingMember,
                          weight: Math.min(
                            5,
                            Math.max(0, parseInt(e.target.value)),
                          ),
                        }
                      : null,
                  )
                }
                className="col-span-3"
              />
            </div>
          </div>
          <Button
            onClick={handleSaveMember}
            className="w-full"
            disabled={isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading
              ? "Guardando..."
              : editingMember && editingMember.id <= members.length
                ? "Guardar Cambios"
                : "Agregar Miembro"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
