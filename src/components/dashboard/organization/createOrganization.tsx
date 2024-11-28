"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface CreateOrganizationProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (organization: {
    id: string;
    name: string;
    createdById: number;
  }) => void;
}

export default function CreateOrganization({
  isOpen,
  onClose,
  onSuccess,
}: CreateOrganizationProps) {
  const [orgName, setOrgName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [effortLimit, setEffortLimit] = useState<number | "">("");

  const handleEffortLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && parseInt(value, 10) >= 0) {
      setEffortLimit(value === "" ? "" : parseInt(value, 10));
    }
  };

  const handleCreateOrganization = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    if (!orgName) {
      setErrorMessage("El nombre de la organización es obligatorio.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: orgName, effortLimit }),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess(data.organization);
        setOrgName("");
        setEffortLimit("");
      } else {
        setErrorMessage(data.message || "Error al crear la organización");
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Error de conexión al crear la organización");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white w-full max-w-lg rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Crear una Nueva Organización
        </h2>
        <p className="text-gray-600 mb-6">
          Configure su organización para empezar a gestionar proyectos y
          equipos.
        </p>
        {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}
        <form onSubmit={handleCreateOrganization}>
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Nombre de la organización
            </label>
            <input
              type="text"
              placeholder="Introduzca el nombre de la organización"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
              disabled={isLoading}
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="effortLimit"
              className="block text-sm font-semibold mb-2 text-gray-700"
            >
              Esfuerzo Límite:
            </label>
            <input
              type="text"
              id="effortLimit"
              value={effortLimit}
              onChange={handleEffortLimitChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
              disabled={isLoading}
            />
          </div>
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              onClick={onClose}
              className="bg-gray-200 text-black p-3 rounded-lg"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-black text-white p-3 rounded-lg"
              disabled={isLoading}
            >
              {isLoading ? "Creando..." : "Crear organización"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
