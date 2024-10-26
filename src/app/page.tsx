import Image from "next/image";

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
      
      <main className="flex-grow flex items-center justify-center">
        {/* Capa de fondo */}
        <div 
          className="w-full h-full absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${backgroundImage})`,  // Usando la imagen importada
          }}
        />
        
        <div className="absolute inset-0 bg-black/30" />
        
        <h1 className="text-4xl md:text-6xl font-bold text-white relative z-10 text-center">
          Next Release
          <br />
          Project
        </h1>
      </main>
    </div>
  )
}
