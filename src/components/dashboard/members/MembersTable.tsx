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
import { Pencil, Plus, Save, Trash2, Loader2 } from "lucide-react";
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
import { useMembers } from "@/hooks/use-members";

interface Member {
  id: number;
  username: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  weight: number;
}

export function MembersTable({ organizationId }: { organizationId: string }) {
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { members, isLoading, error, addMember, updateMember, deleteMember } =
    useMembers(organizationId);

  const handleEditMember = (member: Member) => {
    setEditingMember(member);
    setIsDialogOpen(true);
  };

  const handleSaveMember = async () => {
    if (!editingMember) return;

    try {
      if (editingMember.id === -1) {
        await addMember(editingMember);
      } else {
        await updateMember(editingMember.id, editingMember);
      }

      setEditingMember(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving member:", error);
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
      await deleteMember(memberId);
    } catch (error) {
      console.error("Error deleting member:", error);
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
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={editingMember?.email || ""}
                onChange={(e) =>
                  setEditingMember(
                    editingMember
                      ? {
                          ...editingMember,
                          email: e.target.value,
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
          <Button onClick={handleSaveMember} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {editingMember && editingMember.id <= members.length
              ? "Guardar Cambios"
              : "Agregar Miembro"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
