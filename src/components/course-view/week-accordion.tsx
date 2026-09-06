"use client";

import Link from "next/link";
import { useState } from "react";
import { formatDueDate } from "@/lib/format";

type Lesson = { id: string; title: string; type: string; completed: boolean };
type Quiz = {
  id: string;
  title: string;
  questionCount: number;
  bestScore: number | null;
};
type Assignment = {
  id: string;
  title: string;
  dueDate: string | null;
  status: string;
  score: number | null;
};
type Week = {
  id: string;
  weekNumber: number;
  title: string;
  lessons: Lesson[];
  quizzes: Quiz[];
  assignments: Assignment[];
};

const TYPE_ICON: Record<string, string> = {
  VIDEO: "▶",
  PDF: "📄",
  PRESENTACION: "📊",
  ARCHIVO: "📎",
  LINK_EXTERNO: "🔗",
  ACTIVIDAD: "📝",
};

function StatusChip({ children, tone }: { children: React.ReactNode; tone: "ok" | "pending" | "warn" | "danger" }) {
  const styles = {
    ok: "bg-green-100 text-green-700",
    pending: "bg-slate-100 text-slate-500",
    warn: "bg-amber-100 text-amber-800",
    danger: "bg-red-100 text-red-700",
  } as const;
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[tone]}`}>
      {children}
    </span>
  );
}

function WeekSection({
  week,
  courseId,
  defaultOpen,
}: {
  week: Week;
  courseId: string;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const totalItems = week.lessons.length + week.quizzes.length + week.assignments.length;
  const completedLessons = week.lessons.filter((l) => l.completed).length;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div>
          <p className="font-semibold text-[#0D212C]">
            Semana {String(week.weekNumber).padStart(2, "0")}
          </p>
          <p className="text-sm text-slate-500">{week.title}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-slate-400 sm:inline">
            {completedLessons}/{week.lessons.length} lecciones · {totalItems} recurso(s)
          </span>
          <svg
            viewBox="0 0 24 24"
            className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {open && (
        <ul className="divide-y divide-slate-100 border-t border-slate-100">
          {week.lessons.map((l) => (
            <li key={l.id}>
              <Link
                href={`/alumno/cursos/${courseId}?tab=contenido&leccion=${l.id}`}
                className="flex items-center gap-3 px-5 py-3 text-sm transition hover:bg-slate-50"
              >
                <span className="text-base leading-none">{TYPE_ICON[l.type] ?? "•"}</span>
                <span className="flex-1">{l.title}</span>
                {l.completed ? (
                  <StatusChip tone="ok">Revisado</StatusChip>
                ) : (
                  <StatusChip tone="pending">Pendiente</StatusChip>
                )}
              </Link>
            </li>
          ))}

          {week.quizzes.map((q) => (
            <li key={q.id}>
              <Link
                href={`/alumno/evaluaciones/${q.id}`}
                className="flex items-center gap-3 px-5 py-3 text-sm transition hover:bg-slate-50"
              >
                <span className="text-base leading-none">🧠</span>
                <span className="flex-1">
                  {q.title}
                  <span className="block text-[11px] text-slate-400">
                    {q.questionCount} pregunta(s)
                  </span>
                </span>
                {q.bestScore !== null ? (
                  <StatusChip tone={q.bestScore >= 11 ? "ok" : "warn"}>
                    Nota {q.bestScore.toFixed(0)}
                  </StatusChip>
                ) : (
                  <StatusChip tone="pending">Sin rendir</StatusChip>
                )}
              </Link>
            </li>
          ))}

          {week.assignments.map((a) => (
            <li key={a.id}>
              <Link
                href={`/alumno/tareas/${a.id}`}
                className="flex items-center gap-3 px-5 py-3 text-sm transition hover:bg-slate-50"
              >
                <span className="text-base leading-none">📝</span>
                <span className="flex-1">
                  {a.title}
                  {a.dueDate && (
                    <span className="block text-[11px] text-slate-400">
                      Vence: {formatDueDate(a.dueDate)}
                    </span>
                  )}
                </span>
                {a.status === "APROBADO" ? (
                  <StatusChip tone="ok">Nota {a.score}</StatusChip>
                ) : a.status === "REQUIERE_CORRECCION" ? (
                  <StatusChip tone="danger">Requiere corrección</StatusChip>
                ) : a.status === "BORRADOR" ? (
                  <StatusChip tone="pending">Borrador</StatusChip>
                ) : a.status === "SIN_ENVIAR" ? (
                  <StatusChip tone="pending">Pendiente</StatusChip>
                ) : (
                  <StatusChip tone="warn">En revisión</StatusChip>
                )}
              </Link>
            </li>
          ))}

          {totalItems === 0 && (
            <li className="px-5 py-4 text-sm text-slate-500">
              Esta semana todavía no tiene contenido.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

export function WeekAccordion({ weeks, courseId }: { weeks: Week[]; courseId: string }) {
  // La primera semana con algo pendiente arranca abierta; si todo está al
  // día, se abre la primera. Así el alumno no tiene que buscar dónde sigue.
  const firstPendingIndex = weeks.findIndex((w) =>
    w.lessons.some((l) => !l.completed)
  );
  const openIndex = firstPendingIndex >= 0 ? firstPendingIndex : 0;

  return (
    <div className="space-y-3">
      {weeks.map((week, i) => (
        <WeekSection
          key={week.id}
          week={week}
          courseId={courseId}
          defaultOpen={i === openIndex}
        />
      ))}
      {weeks.length === 0 && (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
          Este curso todavía no tiene semanas de contenido.
        </p>
      )}
    </div>
  );
}
