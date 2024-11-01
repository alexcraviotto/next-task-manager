"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-gradient-to-br from-primary/20 via-background to-secondary/20">
      <Image
        src="/background.png"
        alt="Background Image"
        layout="fill"
        objectFit="cover"
        className="absolute inset-0 z-0 opacity-50"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/50 via-background/50 to-secondary/60 z-10" />

      <header className="p-4 flex justify-between items-center relative z-20">
        <div className="text-2xl font-bold text-primary">Next Release</div>
        <nav className="space-x-4 flex">
          <Button variant="ghost" asChild>
            <a href="/auth/login">Iniciar sesión</a>
          </Button>
          <Button asChild>
            <a href="register">Registrarse</a>
          </Button>
        </nav>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center relative z-20 px-4">
        <h1 className="text-4xl md:text-7xl font-bold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-gray-400">
          Next Release Project
        </h1>
        <p className="text-xl md:text-2xl text-center mb-8 max-w-2xl">
          Acelera tu desarrollo con Next.js y despliega con confianza
        </p>
        <Button size="lg" className="text-lg">
          Comenzar ahora <ArrowRight className="ml-2" />
        </Button>
      </main>

      <footer className="text-center p-4 text-sm text-muted-foreground relative z-20">
        © 2024 Next Release Project. Todos los derechos reservados.
      </footer>
    </div>
  );
}
