"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import {
  AuthDivider,
  AuthInput,
  AuthShell,
  AuthSubmitButton,
  GoogleButton,
} from "@/components/auth-shell";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleNotice, setGoogleNotice] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Correo o contraseña incorrectos");
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <AuthShell
      badge="Conocimiento · Experiencia · Innovación"
      headlineTop="Juntos rumbo a tu"
      headlineBottom="plaza remunerada"
    >
      <h1 className="entry entry-h1 text-[28px] font-bold tracking-tight text-[#2c3343] sm:text-[32px]">
        ¡Bienvenido de nuevo!
      </h1>
      <p className="entry entry-sub mt-2 text-[15px] text-[#797979]">
        <b className="font-semibold text-[#3a3a3a]">Inicia sesión</b> para
        continuar tu preparación.
      </p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-3.5">
        <div className="entry entry-f1">
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

        <div className="entry entry-f2">
          <AuthInput
            id="password"
            type="password"
            variant="filled"
            required
            autoComplete="current-password"
            aria-label="Contraseña"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="flex justify-end">
          <Link
            href="/recuperar-password"
            className="text-xs font-medium text-slate-500 hover:text-indigo-600"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <AuthSubmitButton disabled={loading}>
          {loading ? "Ingresando..." : "Ingresar"}
        </AuthSubmitButton>
      </form>

      <AuthDivider />

      <GoogleButton
        label="Continuar con Google"
        onClick={() => setGoogleNotice(true)}
      />

      {googleNotice && (
        <p className="mt-2 text-center text-xs text-slate-500">
          El acceso con Google estará disponible próximamente.
        </p>
      )}

      <p className="entry entry-bottom mt-6 text-center text-sm text-slate-600">
        ¿No tienes cuenta?{" "}
        <Link
          href="/registro"
          className="font-bold text-black underline decoration-2 underline-offset-[3px]"
        >
          Crear cuenta
        </Link>
      </p>
    </AuthShell>
  );
}
