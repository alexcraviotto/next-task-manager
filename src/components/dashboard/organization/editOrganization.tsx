"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface EditOrganizationProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  organizationId: string;
  initialEffortLimit?: number;
  organizationName: string;
}

export default function EditOrganization({
  isOpen,
  onClose,
  onSuccess,
  organizationId,
  initialEffortLimit,
  organizationName,
}: EditOrganizationProps) {
  const [effortLimit, setEffortLimit] = useState<number | "">(
    initialEffortLimit || "",
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleEffortLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && parseInt(value, 10) >= 0) {
      setEffortLimit(value === "" ? "" : parseInt(value, 10));
    }
  };

  const handleEditOrganization = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/organizations/${organizationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ effortLimit }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await response.json();
        setErrorMessage(data.message || "Error al actualizar la organización");
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Error de conexión al actualizar la organización");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white w-full max-w-lg rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Editar Organización: {organizationName}
        </h2>
        {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}
        <form onSubmit={handleEditOrganization}>
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
              {isLoading ? "Actualizando..." : "Actualizar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
