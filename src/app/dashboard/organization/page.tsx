"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signOut, useSession } from "next-auth/react";
import { useOrganizations } from "@/hooks/use-organizations";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function OrganizationsPage() {
  const [showJoinOrg, setShowJoinOrg] = useState(false);
  const { update, data: session } = useSession();
  const { organizations, loading, error } = useOrganizations();
  const [inviteCode, setInviteCode] = useState("");
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleShowJoinOrg = () => setShowJoinOrg(true);
  const handleDecline = () => setShowJoinOrg(false);

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: inviteCode }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Error al unirse a la organización");
      }

      // Forzar actualización de la sesión
      await update();

      toast({ description: "Te has unido a la organización correctamente" });
      router.push(`/dashboard/organization/${data.organization.id}/tasks`);
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
  console.log("🚀 ~ OrganizationsPage ~ data?.user:", session?.user);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="flex min-h-screen"
    >
      <div
        className="hidden md:block md:w-1/2 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("/background-inicio_sesion.png")',
          backgroundColor: "#f3f4f6",
        }}
        aria-hidden="true"
      />

      <div className="relative w-full md:w-1/2 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 bg-white">
        <Button
          onClick={async () => await signOut()}
          className="hidden sm:flex items-center hover:scale-105 top-4 transition-transform duration-200 right-4 absolute"
        >
          <span className="text-sm">Cerrar sesión</span>
        </Button>
        <div className="w-full max-w-md space-y-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={showJoinOrg ? "joinView" : "mainView"}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
            >
              {!showJoinOrg ? (
                <>
                  <div className="mb-8">
                    <h1 className="text-2xl font-semibold flex items-center gap-2">
                      <span role="img" aria-label="waving hand">
                        👋
                      </span>
                      Hola, {session?.user?.name ?? "Sin nombre"}.
                    </h1>
                    <p className="text-gray-600 mt-2">
                      Estas son tus organizaciones.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {organizations.map((org) => (
                      <motion.button
                        key={org.id}
                        className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-150"
                        onClick={() =>
                          router.push(`/dashboard/organization/${org.id}`)
                        }
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {org.name}
                      </motion.button>
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
                      className={`w-full p-2 border rounded-md ${joinError ? "border-red-500" : "border-gray-300"}`}
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
                    <Button
                      onClick={handleDecline}
                      disabled={isJoining}
                      className="border rounded-md hover:bg-black/70"
                    >
                      Declinar
                    </Button>
                    <Button
                      onClick={handleJoin}
                      disabled={isJoining}
                      className="bg-black text-white rounded-md hover:bg-black/70"
                    >
                      {isJoining ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2 inline" />
                          Uniéndose...
                        </>
                      ) : (
                        "Unirse"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
