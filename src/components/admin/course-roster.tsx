"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

type Student = {
  id: string;
  enrollmentId: string;
  name: string;
  email: string;
  progressPct: number;
  promedio: number | null;
  enrolledAt: string;
  completedAt: string | null;
};

const dateFmt = new Intl.DateTimeFormat("es", { day: "2-digit", month: "short", year: "numeric" });

type Filtro = "TODOS" | "COMPLETADO" | "EN_CURSO" | "SIN_AVANCE";

function QuitarButton({ enrollmentId, studentName }: { enrollmentId: string; studentName: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);

  const quitar = async () => {
    if (!confirm(`¿Quitar a ${studentName} de este curso? Perderá acceso al contenido.`)) return;
    setLoading(true);
    try {
      await fetch(`/api/enrollments/${enrollmentId}`, { method: "DELETE" });
    } catch {
      // El botón se libera igual abajo; si falló, la fila simplemente sigue ahí.
    }
    setLoading(false);
    startTransition(() => router.refresh());
  };

  return (
    <button
      onClick={quitar}
      disabled={loading}
      className="rounded border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-60"
    >
      {loading ? "Quitando..." : "Quitar"}
    </button>
  );
}

export function CourseRoster({
  courseTitle,
  students,
  backHref,
  chatBaseHref,
  historyBaseHref,
}: {
  courseTitle: string;
  students: Student[];
  backHref: string;
  /** Ruta del chat para escribirle a un alumno, p. ej. "/chat?con=". */
  chatBaseHref: string;
  /** Ruta del historial del alumno, p. ej. "/docente/cursos/ID/alumnos/". */
  historyBaseHref: string;
}) {
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("TODOS");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return students.filter((s) => {
      const matchesText =
        !term || s.name.toLowerCase().includes(term) || s.email.toLowerCase().includes(term);
      const matchesFiltro =
        filtro === "TODOS" ||
        (filtro === "COMPLETADO" && !!s.completedAt) ||
        (filtro === "EN_CURSO" && !s.completedAt && s.progressPct > 0) ||
        (filtro === "SIN_AVANCE" && s.progressPct === 0);
      return matchesText && matchesFiltro;
    });
  }, [students, q, filtro]);

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={backHref}
          className="text-xs font-medium text-slate-500 hover:text-indigo-600"
        >
          ← Volver al curso
        </Link>
        <h1 className="mt-2 text-xl font-bold">Alumnos de {courseTitle}</h1>
        <p className="text-sm text-slate-600">
          {students.length} alumno(s) matriculados
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre o correo..."
          className="w-64 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
        />
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value as Filtro)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
        >
          <option value="TODOS">Todos</option>
          <option value="COMPLETADO">Completaron el curso</option>
          <option value="EN_CURSO">En curso</option>
          <option value="SIN_AVANCE">Sin avance</option>
        </select>
        {(q || filtro !== "TODOS") && (
          <span className="text-xs text-slate-500">
            {filtered.length} de {students.length}
          </span>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Alumno</th>
              <th className="px-4 py-3">Progreso</th>
              <th className="px-4 py-3">Promedio</th>
              <th className="px-4 py-3">Matriculado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3">
                  <p className="font-medium">{s.name}</p>
                  <p className="text-xs text-slate-500">{s.email}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-indigo-600"
                        style={{ width: `${s.progressPct}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500">{s.progressPct}%</span>
                    {s.completedAt && (
                      <span className="text-xs text-green-600" title="Curso completado">
                        ✓
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {s.promedio !== null ? (
                    <span
                      className={s.promedio >= 11 ? "text-green-700" : "text-red-600"}
                    >
                      {s.promedio.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">Sin notas</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {dateFmt.format(new Date(s.enrolledAt))}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5">
                    <Link
                      href={`${historyBaseHref}${s.id}`}
                      className="rounded border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50"
                    >
                      Historial
                    </Link>
                    <Link
                      href={`${chatBaseHref}${s.id}`}
                      className="rounded border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50"
                    >
                      Escribirle
                    </Link>
                    <QuitarButton enrollmentId={s.enrollmentId} studentName={s.name} />
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  {students.length === 0
                    ? "Todavía no hay alumnos matriculados en este curso."
                    : "Ningún alumno coincide con la búsqueda."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
