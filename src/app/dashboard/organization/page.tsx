"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function OrganizationFormPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [description, setDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  //const [existingOrganizations, setExistingOrganizations] = useState([]); // Simulación de organizaciones existentes

  const togglePopup = () => {
    setIsOpen(!isOpen);
  };

  const handleCreateOrganization = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!orgName) {
      setErrorMessage("El nombre de la organización es obligatorio.");
      return;
    }
    /*
    // Comprobar si el nombre ya existe en la base de datos (simulación)
    if (existingOrganizations.includes(orgName)) {
      setErrorMessage("Ya existe una organización con este nombre.");
      return;
    }
    */
    // Logica para crear la organización en la base de datos

    // Limpiar el formulario después de crear la organización
    setOrgName("");
    setDescription("");
    setErrorMessage("");
    togglePopup(); // Cierra el popup
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-100">
      <Button
        onClick={togglePopup}
        className="bg-black text-white p-3 rounded-lg"
      >
        Crear Nueva Organización
      </Button>

      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Crear una Nueva Organización
            </h2>
            <p className="text-gray-600 mb-6">
              Configure su organización para empezar a gestionar proyectos y
              equipos.
            </p>
            {errorMessage && (
              <p className="text-red-500 mb-4">{errorMessage}</p>
            )}
            <form onSubmit={handleCreateOrganization}>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Nombre de la organización
                </label>
                <input
                  type="text"
                  placeholder="Introduzca el nombre de la organización"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)} // Actualiza el nombre de la organización
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Descripción
                </label>
                <textarea
                  placeholder="Describa brevemente su descripción"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)} // Actualiza la descripción
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                  rows={4}
                ></textarea>
              </div>
              <div className="flex justify-end space-x-4">
                <Button
                  onClick={togglePopup}
                  className="bg-gray-200 text-black p-3 rounded-lg"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-black text-white p-3 rounded-lg"
                >
                  Crear organización
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
