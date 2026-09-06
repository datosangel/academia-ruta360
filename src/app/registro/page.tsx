"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AuthDivider,
  AuthInput,
  AuthShell,
  AuthSubmitButton,
  GoogleButton,
} from "@/components/auth-shell";

export default function RegistroPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleNotice, setGoogleNotice] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Ocurrió un error");
      return;
    }

    router.push("/login");
  };

  return (
    <AuthShell
      badge="Preparación ENCAPS–SERUMS"
      headlineTop="Empieza tu preparación"
      headlineBottom="hoy mismo"
    >
      <h1 className="entry entry-h1 text-[28px] font-bold tracking-tight text-[#2c3343] sm:text-[32px]">
        Crea tu cuenta
      </h1>
      <p className="entry entry-sub mt-2 text-[15px] text-[#797979]">
        <b className="font-semibold text-[#3a3a3a]">Regístrate</b> y accede a
        tus áreas de preparación.
      </p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-3.5">
        <div className="entry entry-f1">
          <AuthInput
            id="name"
            type="text"
            required
            autoComplete="name"
            aria-label="Nombre completo"
            placeholder="Nombre completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="entry entry-f2">
          <AuthInput
            id="email"
            type="email"
            required
            autoComplete="email"
            aria-label="Correo electrónico"
            placeholder="Ej. juanperez@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="entry entry-f3">
          <AuthInput
            id="password"
            type="password"
            variant="filled"
            required
            minLength={8}
            autoComplete="new-password"
            aria-label="Contraseña"
            placeholder="Contraseña (mínimo 8 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <AuthSubmitButton disabled={loading}>
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </AuthSubmitButton>
      </form>

      <AuthDivider />

      <GoogleButton
        label="Registrarme con Google"
        onClick={() => setGoogleNotice(true)}
      />

      {googleNotice && (
        <p className="mt-2 text-center text-xs text-slate-500">
          El registro con Google estará disponible próximamente.
        </p>
      )}

      <p className="entry entry-bottom mt-6 text-center text-sm text-slate-600">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/login"
          className="font-bold text-black underline decoration-2 underline-offset-[3px]"
        >
          Iniciar sesión
        </Link>
      </p>
    </AuthShell>
  );
}
