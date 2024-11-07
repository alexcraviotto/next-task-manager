"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Organization {
  id: string;
  name: string;
}

export default function OrganizationsPage() {
  const [showJoinOrg, setShowJoinOrg] = useState(false);
  const organizations: Organization[] = [
    { id: "1", name: "ACME Inc." },
    { id: "2", name: "Adidas" },
    { id: "3", name: "Nike" },
  ];
  const [inviteCode, setInviteCode] = useState("");
  const router = useRouter();

  const handleShowJoinOrg = () => {
    setShowJoinOrg(true);
  };

  const handleDecline = () => {
    setShowJoinOrg(false);
  };

  const handleJoin = () => {
    // Aquí iría la lógica para unirse a la organización
    console.log("Unirse con código:", inviteCode);
    // Después de unirse exitosamente:
    setShowJoinOrg(false);
    // Luego, redirigir a la página de la organización (hacerlo luego correctamente. Lo hago para hacer commit & push)
    router.push("/auth/register");
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      {!showJoinOrg ? (
        // Vista principal de organizaciones
        <>
          <div className="mb-8">
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <span role="img" aria-label="waving hand">
                👋
              </span>
              Hola, Javi.
            </h1>
            <p className="text-gray-600 mt-2">Estas son tus organizaciones.</p>
          </div>

          <div className="space-y-2">
            {organizations.map((org) => (
              <button
                key={org.id}
                className="w-full text-left p-3 rounded-lg border border-gray-200 
                         hover:bg-gray-50 transition-colors duration-150"
              >
                {org.name}
              </button>
            ))}
          </div>

          <div className="mt-6">
            <Button
              onClick={handleShowJoinOrg}
              variant="default"
              className="w-full bg-black text-white rounded-lg"
            >
              Unirse a organización
            </Button>
          </div>
        </>
      ) : (
        // Vista de unirse a organización
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Unirse a Organización</h2>
          <p className="text-gray-600 mb-4">
            Has sido invitado a unirte a ACME Inc. Introduzca el código de
            invitación para continuar.
          </p>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código de invitación
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="w-full p-2 border rounded-md"
              placeholder="Entra tu código de invitación"
            />
          </div>

          <p className="text-sm text-gray-500 mb-6">
            Al unirte a esta organización, tendrás acceso a sus proyectos,
            tareas y recursos. Puedes abandonar la organización en cualquier
            momento.
          </p>

          <div className="flex gap-3">
            <button
              onClick={handleDecline}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Declinar
            </button>
            <button
              onClick={handleJoin}
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
            >
              Unirse
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
