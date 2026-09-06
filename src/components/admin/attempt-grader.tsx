"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Answer = {
  id: string;
  questionText: string;
  questionType: string;
  maxPoints: number;
  value: string;
  pointsGot: number | null;
  isCorrect: boolean | null;
};

export function AttemptGrader({
  attemptId,
  studentName,
  quizTitle,
  score,
  answers,
  backHref,
}: {
  attemptId: string;
  studentName: string;
  quizTitle: string;
  score: number | null;
  answers: Answer[];
  backHref: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const abiertas = answers.filter((a) => a.questionType === "ABIERTA");
  const cerradas = answers.filter((a) => a.questionType !== "ABIERTA");

  const [grades, setGrades] = useState<Record<string, string>>(
    Object.fromEntries(
      abiertas.map((a) => [a.id, a.pointsGot !== null ? String(a.pointsGot) : ""])
    )
  );

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    // Solo se envían las respuestas a las que el docente puso puntaje.
    const payload = Object.fromEntries(
      Object.entries(grades)
        .filter(([, v]) => v !== "")
        .map(([k, v]) => [k, Number(v)])
    );

    let res: Response;
    try {
      res = await fetch(`/api/attempts/${attemptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grades: payload }),
      });
    } catch {
      setSaving(false);
      setError("No se pudo conectar con el servidor. Intenta de nuevo.");
      return;
    }

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo guardar la calificación");
      return;
    }

    setSaved(true);
    startTransition(() => router.refresh());
  };

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <Link
          href={backHref}
          className="text-xs font-medium text-slate-500 hover:text-indigo-600"
        >
          ← Volver a la evaluación
        </Link>
        <h1 className="mt-2 text-xl font-bold">{studentName}</h1>
        <p className="text-sm text-slate-600">
          {quizTitle} · Nota actual:{" "}
          <strong className="text-slate-800">{score?.toFixed(2) ?? "—"}</strong> / 20
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {saved && (
        <p className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">
          Calificación guardada. La nota se recalculó.
        </p>
      )}

      {/* ---------- Preguntas abiertas: las califica el docente ---------- */}
      {abiertas.length > 0 ? (
        <form
          onSubmit={guardar}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p className="font-medium">Respuestas por calificar</p>

          {abiertas.map((a) => (
            <div key={a.id} className="border-b border-slate-100 pb-4 last:border-0">
              <p className="text-sm font-medium">{a.questionText}</p>

              <p className="mt-2 whitespace-pre-line rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {a.value || (
                  <em className="text-slate-400">El alumno no respondió</em>
                )}
              </p>

              <label className="mt-2 flex items-center gap-2 text-xs font-medium text-slate-600">
                Puntaje
                <input
                  type="number"
                  min={0}
                  max={a.maxPoints}
                  step="0.5"
                  value={grades[a.id] ?? ""}
                  onChange={(e) =>
                    setGrades({ ...grades, [a.id]: e.target.value })
                  }
                  className="w-24 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                />
                <span className="font-normal text-slate-400">
                  de {a.maxPoints}
                </span>
              </label>
            </div>
          ))}

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar calificación"}
          </button>
        </form>
      ) : (
        <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
          Este intento no tiene preguntas abiertas: se calificó automáticamente.
        </p>
      )}

      {/* ---------- Preguntas cerradas: solo lectura ---------- */}
      {cerradas.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-3 font-medium">Preguntas calificadas automáticamente</p>
          <ul className="space-y-2">
            {cerradas.map((a) => (
              <li key={a.id} className="flex items-start gap-2 text-sm">
                <span className={a.isCorrect ? "text-green-600" : "text-red-500"}>
                  {a.isCorrect ? "✓" : "✗"}
                </span>
                <span className="flex-1 text-slate-700">{a.questionText}</span>
                <span className="shrink-0 text-xs text-slate-500">
                  {a.pointsGot ?? 0} / {a.maxPoints}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
