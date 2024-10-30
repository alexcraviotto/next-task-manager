"use client";
import { useState } from "react";

export default function RegisterForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await response.json();
    console.log(data);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg"
    >
      <h2 className="text-2xl font-bold mb-6 text-center">Registrarse</h2>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Nombre"
        className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
      />
      <input
        type="text"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Apellidos"
        className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Contraseña"
        className="w-full p-3 mb-6 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
      />
      <button
        type="submit"
        className="w-full p-3 bg-black text-white rounded-lg font-semibold"
      >
        Continuar
      </button>
      <p className="mt-4 text-center">
        ¿Tienes cuenta?{" "}
        <a href="/login" className="text-black underline">
          Iniciar sesión
        </a>
      </p>
    </form>
  );
}
