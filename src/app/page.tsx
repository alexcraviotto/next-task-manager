import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <header className="p-4 flex justify-end relative z-10">
        <nav className="space-x-4">
          <Button variant="ghost" className="text-white hover:text-white hover:bg-white/20">
            Iniciar sesión
          </Button>
          <Button className="bg-white text-black hover:bg-gray-100">
            Registrarse
          </Button>
        </nav>
      </header>

      <main className="flex-grow flex items-center justify-center relative">
        {/* Capa de fondo usando el componente Image */}
        <Image
          src="/background.jpg" // Usa el nombre y la extensión de tu imagen
          alt="Background Image"
          layout="fill"
          objectFit="cover"
          className="absolute inset-0 z-0"
        />

        {/* Overlay para oscurecer la imagen */}
        <div className="absolute inset-0 bg-black/30 z-10" />

        <h1 className="text-4xl md:text-6xl font-bold text-white relative z-20 text-center">
          Next Release
          <br />
          Project
        </h1>
      </main>
    </div>
  );
}
