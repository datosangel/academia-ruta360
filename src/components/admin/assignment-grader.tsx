"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { formatDueDate } from "@/lib/format";

type StudentRow = {
  submissionId: string | null;
  studentId: string;
  studentName: string;
  studentEmail: string;
  fileUrl: string | null;
  comment: string | null;
  status: string;
  score: number | null;
  feedback: string | null;
  submittedAt: string | null;
};

const STATUS_STYLE: Record<string, string> = {
  SIN_ENVIAR: "bg-slate-100 text-slate-600",
  BORRADOR: "bg-slate-100 text-slate-600",
  ENTREGADO: "bg-amber-100 text-amber-800",
  REQUIERE_CORRECCION: "bg-red-100 text-red-700",
  APROBADO: "bg-green-100 text-green-700",
};

const STATUS_LABEL: Record<string, string> = {
  SIN_ENVIAR: "Sin entregar",
  BORRADOR: "Sin entregar",
  ENTREGADO: "Por revisar",
  REQUIERE_CORRECCION: "En corrección",
  APROBADO: "Aprobada",
};

const dateFmt = new Intl.DateTimeFormat("es", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function GradeRow({ row }: { row: StudentRow }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [mode, setMode] = useState<"aprobar" | "corregir" | null>(null);
  const [score, setScore] = useState(row.score !== null ? String(row.score) : "");
  const [feedback, setFeedback] = useState(row.feedback ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const puedeResolver = row.submissionId !== null;

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!row.submissionId || !mode) return;
    setSaving(true);
    setError(null);

    const body =
      mode === "aprobar"
        ? { action: "aprobar", score: Number(score), feedback }
        : { action: "corregir", feedback };

    let res: Response;
    try {
      res = await fetch(`/api/submissions/${row.submissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      setSaving(false);
      setError("No se pudo conectar con el servidor. Intenta de nuevo.");
      return;
    }

    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo guardar");
      return;
    }
    setMode(null);
    startTransition(() => router.refresh());
  };

  return (
    <li className="px-5 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{row.studentName}</p>
          <p className="text-xs text-slate-500">{row.studentEmail}</p>
        </div>

        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[row.status]}`}
        >
          {STATUS_LABEL[row.status]}
        </span>

        {row.score !== null && (
          <span className="text-sm text-slate-700">
            Nota: <strong>{row.score}</strong>
          </span>
        )}

        {row.submittedAt && (
          <span className="text-xs text-slate-400">
            {dateFmt.format(new Date(row.submittedAt))}
          </span>
        )}

        {puedeResolver && (
          <div className="flex gap-1.5">
            <button
              onClick={() => setMode((m) => (m === "aprobar" ? null : "aprobar"))}
              className="rounded border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50"
            >
              {row.status === "APROBADO" ? "Editar nota" : "Aprobar"}
            </button>
            <button
              onClick={() => setMode((m) => (m === "corregir" ? null : "corregir"))}
              className="rounded border border-slate-300 px-3 py-1 text-xs text-red-700 hover:bg-red-50"
            >
              Solicitar corrección
            </button>
          </div>
        )}
      </div>

      {mode && (
        <div className="mt-3 rounded-lg bg-slate-50 p-4">
          {row.fileUrl && (
            <p className="mb-2 text-sm">
              Enlace entregado:{" "}
              <a
                href={row.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 underline"
              >
                {row.fileUrl}
              </a>
            </p>
          )}
          {row.comment && (
            <p className="mb-3 whitespace-pre-line rounded-lg bg-white px-3 py-2 text-sm text-slate-700">
              {row.comment}
            </p>
          )}

          <form onSubmit={guardar} className="space-y-2">
            {mode === "aprobar" && (
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-600">
                  Nota
                  <input
                    type="number"
                    min={0}
                    step="0.5"
                    required
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    className="ml-2 w-24 rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </label>
              </div>
            )}
            <textarea
              rows={2}
              required={mode === "corregir"}
              placeholder={
                mode === "corregir"
                  ? "Explica qué debe corregir el alumno (obligatorio)"
                  : "Comentario para el alumno (opcional)"
              }
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={saving}
              className={`rounded-lg px-4 py-1.5 text-xs font-medium text-white disabled:opacity-60 ${
                mode === "corregir"
                  ? "bg-red-600 hover:bg-red-500"
                  : "bg-indigo-600 hover:bg-indigo-500"
              }`}
            >
              {saving
                ? "Guardando..."
                : mode === "corregir"
                  ? "Enviar respuesta"
                  : "Guardar calificación"}
            </button>
          </form>
        </div>
      )}
    </li>
  );
}

export function AssignmentGrader({
  assignment,
  students,
  backHref,
}: {
  assignment: {
    title: string;
    description: string;
    dueDate: string | null;
    maxScore: number;
    courseTitle: string;
    moduleTitle: string;
  };
  students: StudentRow[];
  backHref: string;
}) {
  const entregadas = students.filter((s) => s.submissionId !== null).length;
  const aprobadas = students.filter((s) => s.status === "APROBADO").length;

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <Link
          href={backHref}
          className="text-xs font-medium text-slate-500 hover:text-indigo-600"
        >
          ← Volver al curso
        </Link>
        <h1 className="mt-2 text-xl font-bold">{assignment.title}</h1>
        <p className="text-sm text-slate-600">
          {assignment.courseTitle} · {assignment.moduleTitle} · sobre{" "}
          {assignment.maxScore} puntos
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="whitespace-pre-line text-sm text-slate-700">
          {assignment.description}
        </p>
        {assignment.dueDate && (
          <p className="mt-2 text-xs text-slate-500">
            Fecha límite: {formatDueDate(assignment.dueDate)}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Alumnos</p>
          <p className="mt-0.5 text-lg font-bold">{students.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Entregadas</p>
          <p className="mt-0.5 text-lg font-bold">{entregadas}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Aprobadas</p>
          <p className="mt-0.5 text-lg font-bold">{aprobadas}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <p className="border-b border-slate-100 px-5 py-3 font-medium">
          Entregas de los alumnos
        </p>
        <ul className="divide-y divide-slate-100">
          {students.map((s) => (
            <GradeRow key={s.studentId} row={s} />
          ))}
          {students.length === 0 && (
            <li className="px-5 py-6 text-center text-sm text-slate-500">
              Aún no hay alumnos matriculados en este curso.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
