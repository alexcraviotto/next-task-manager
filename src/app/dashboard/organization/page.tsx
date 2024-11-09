"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { useOrganizations } from "@/hooks/use-organizations";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function OrganizationsPage() {
  const [showJoinOrg, setShowJoinOrg] = useState(false);
  const { data } = useSession();
  const { organizations, loading, error } = useOrganizations();

  console.log("🚀 ~ OrganizationsPage ~ data:", JSON.stringify(data));
  const [inviteCode, setInviteCode] = useState("");
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleShowJoinOrg = () => {
    setShowJoinOrg(true);
  };

  const handleDecline = () => {
    setShowJoinOrg(false);
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      setJoinError("El código de invitación es requerido");
      return;
    }

    setIsJoining(true);
    setJoinError(null);

    try {
      const response = await fetch("/api/organizations/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: inviteCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al unirse a la organización");
      }

      toast({
        description: "Te has unido a la organización correctamente",
      });

      // Redirigir a la página de la organización
      router.push(`/dashboard/organization/${data.organization.id}`);
    } catch (error) {
      setJoinError(
        error instanceof Error
          ? error.message
          : "Error al unirse a la organización",
      );
    } finally {
      setIsJoining(false);
    }
  };

  // Renderizado condicional para estados de carga y error
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Contenedor principal con altura mínima de pantalla completa */}
      <div className="flex min-h-screen">
        {/* Columna izquierda: Imagen de fondo */}
        <div
          className="hidden md:block md:w-1/2 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url("/background-inicio_sesion.png")',
            backgroundColor: "#f3f4f6", // Fallback color
          }}
          aria-hidden="true"
        />

        {/* Columna derecha: Contenido del login */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 bg-white">
          {/* Contenedor del formulario */}
          <div className="w-full max-w-md space-y-8">
            <div className="p-6 max-w-md mx-auto">
              {!showJoinOrg ? (
                // Vista principal de organizaciones
                <>
                  <div className="mb-8">
                    <h1 className="text-2xl font-semibold flex items-center gap-2">
                      <span role="img" aria-label="waving hand">
                        👋
                      </span>
                      Hola, {data?.user?.username ?? "Sin nombre"}.
                    </h1>
                    <p className="text-gray-600 mt-2">
                      Estas son tus organizaciones.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {organizations.map((org) => (
                      <button
                        key={org.id}
                        className="w-full text-left p-3 rounded-lg border border-gray-200 
                         hover:bg-gray-50 transition-colors duration-150"
                        onClick={() =>
                          router.push(`/dashboard/organization/${org.id}`)
                        }
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
                  <h2 className="text-xl font-semibold mb-4">
                    Unirse a Organización
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Introduzca el código de invitación para continuar.
                  </p>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Código de invitación
                    </label>
                    <input
                      type="text"
                      value={inviteCode}
                      onChange={(e) => {
                        setInviteCode(e.target.value);
                        setJoinError(null);
                      }}
                      className={`w-full p-2 border rounded-md ${
                        joinError ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Introduce tu código de invitación"
                      disabled={isJoining}
                    />
                    {joinError && (
                      <p className="mt-1 text-sm text-red-600">{joinError}</p>
                    )}
                  </div>

                  <p className="text-sm text-gray-500 mb-6">
                    Al unirte a esta organización, tendrás acceso a sus
                    proyectos, tareas y recursos. Puedes abandonar la
                    organización en cualquier momento.
                  </p>

                  <div className="flex gap-3">
                    <button
                      onClick={handleDecline}
                      className="px-4 py-2 border rounded-md hover:bg-gray-50"
                      disabled={isJoining}
                    >
                      Declinar
                    </button>
                    <button
                      onClick={handleJoin}
                      className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50"
                      disabled={isJoining}
                    >
                      {isJoining ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2 inline" />
                          Uniéndose...
                        </>
                      ) : (
                        "Unirse"
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
