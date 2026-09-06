"use client";

import { useState } from "react";
import Link from "next/link";

export default function RecuperarPasswordPage() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: conectar con envío real de correo de recuperación
    setSent(true);
  };

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Recuperar contraseña</h1>
          <p className="mt-1 text-sm text-slate-600">
            Te enviaremos un enlace para restablecerla
          </p>
        </div>

        {sent ? (
          <p className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
            Si el correo está registrado, recibirás un enlace de
            recuperación en breve.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
            >
              Enviar enlace
            </button>
          </form>
        )}

        <p className="text-center text-sm text-slate-600">
          <Link href="/login" className="text-indigo-600 hover:underline">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
