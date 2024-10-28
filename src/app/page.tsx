import Image from "next/image";
import Head from "next/head"; // Importa el componente Head

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <Head>
        <title>Next Release Project</title>{" "}
        {/* Cambia esto al título deseado */}
      </Head>

      {/* Capa de fondo usando el componente Image */}
      <Image
        src="/background.png" // Usa el nombre y la extensión de tu imagen
        alt="Background Image"
        layout="fill"
        objectFit="cover"
        className="absolute inset-0 z-0"
      />
      {/* Overlay para oscurecer la imagen */}
      <div className="absolute inset-0 bg-black/30 z-10" />

      <header className="p-4 flex justify-end relative z-20">
        <nav className="space-x-4 flex">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-transparent text-black gap-2 hover:bg-[#f0f0f0] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
            href="/login" // Cambia esto a la ruta correspondiente para iniciar sesión
          >
            Iniciar sesión
          </a>
          <a
            className="rounded-full border border-solid border-black transition-colors flex items-center justify-center bg-black text-white gap-2 hover:bg-[#333] dark:hover:bg-[#444] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
            href="/register" // Cambia esto a la ruta correspondiente para registrarse
          >
            Registrarse
          </a>
        </nav>
      </header>

      <main className="flex-grow flex items-center justify-center relative z-20">
        <h1 className="text-4xl md:text-6xl font-bold text-black text-center">
          Next Release
          <br />
          Project
        </h1>
      </main>
    </div>
  );
}
