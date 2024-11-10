import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar Sesión",
  description: "Accede a tu cuenta para continuar",
};

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen">
      {/* Sección de la imagen de fondo */}
      <div className="w-1/2 bg-cover bg-center bg-[url('/background-inicio_sesion.png')]"></div>

      <div className="w-1/2 flex items-center justify-center bg-white">
        {children}
      </div>
    </div>
  );
}
