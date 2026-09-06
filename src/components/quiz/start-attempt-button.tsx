"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function StartAttemptButton({
  quizId,
  hayIntentoEnCurso,
  sinIntentos,
}: {
  quizId: string;
  hayIntentoEnCurso: boolean;
  sinIntentos: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const empezar = async () => {
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/quizzes/${quizId}/attempts`, {
      method: "POST",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo iniciar la evaluación");
      setLoading(false);
      return;
    }

    // Sin `router.refresh()`: al ser la misma ruta y cambiar solo el
    // parámetro, el refresco cancelaba la navegación y devolvía a la portada.
    router.push(`/alumno/evaluaciones/${quizId}?rendir=1`);
  };

  if (sinIntentos && !hayIntentoEnCurso) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
        Ya usaste todos tus intentos en esta evaluación. Abajo puedes revisar tus
        resultados.
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      {hayIntentoEnCurso && (
        <p className="mb-3 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Tienes un intento sin entregar. Continúa donde te quedaste.
        </p>
      )}

      <button
        onClick={empezar}
        disabled={loading}
        className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
      >
        {loading
          ? "Preparando..."
          : hayIntentoEnCurso
            ? "Continuar evaluación"
            : "Empezar evaluación"}
      </button>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
