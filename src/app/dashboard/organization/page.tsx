"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function OrganizationFormPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [description, setDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [organizations, setOrganizations] = useState([
    // Datos para mockup
    {
      id: 1,
      name: "ACME Inc.",
      description: "Proveedor líder de soluciones tecnológicas",
    },
    { id: 2, name: "Adidas", description: "Marca deportiva internacional" },
    {
      id: 3,
      name: "Nike",
      description: "Fabricante de calzado y ropa deportiva",
    },
  ]);

  const togglePopup = () => {
    setIsOpen(!isOpen);
    setErrorMessage(""); // Resetear el mensaje de error al cerrar o abrir el popup
    setOrgName("");
    setDescription(""); // Limpiar campos al cerrar el popup
  };

  const handleCreateOrganization = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!orgName) {
      setErrorMessage("El nombre de la organización es obligatorio.");
      return;
    }

    // Verificar si ya existe una organizacion con el mismo nombre
    const organizationExists = organizations.some(
      (org) => org.name.toLowerCase() === orgName.toLowerCase(),
    );

    if (organizationExists) {
      setErrorMessage("Ya existe una organización con ese nombre.");
      return;
    }

    // Crear una nueva organizacion mockup y agregarla al estado
    const newOrganization = {
      id: organizations.length + 1,
      name: orgName,
      description: description,
    };
    // Para el posible backend
    setOrganizations([...organizations, newOrganization]);
    setOrgName("");
    setDescription("");
    setErrorMessage("");
    togglePopup();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
      <Button
        onClick={togglePopup}
        className="bg-black text-white p-3 rounded-lg mb-6"
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
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Descripción
                </label>
                <textarea
                  placeholder="Describa brevemente su organización"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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

      {/* Mostrar organizaciones con un poco más de margen Relacionado con mockup*/}
      <div className="mt-12">
        <h3 className="text-xl font-bold mb-4">
          Estas son tus organizaciones:
        </h3>
        <ul>
          {organizations.map((org) => (
            <li
              key={org.id}
              className="border border-gray-300 p-4 rounded-lg mb-2 text-lg"
            >
              {org.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
