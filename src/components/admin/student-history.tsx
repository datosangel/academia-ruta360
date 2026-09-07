import Link from "next/link";
import { formatDueDate } from "@/lib/format";

const dateFmt = new Intl.DateTimeFormat("es", { day: "2-digit", month: "short", year: "numeric" });

const SUBMISSION_LABEL: Record<string, string> = {
  BORRADOR: "Sin entregar",
  ENTREGADO: "Por revisar",
  REQUIERE_CORRECCION: "En corrección",
  APROBADO: "Aprobada",
};

const SUBMISSION_STYLE: Record<string, string> = {
  BORRADOR: "bg-slate-100 text-slate-600",
  ENTREGADO: "bg-amber-100 text-amber-800",
  REQUIERE_CORRECCION: "bg-red-100 text-red-700",
  APROBADO: "bg-green-100 text-green-700",
};

type History = {
  courseTitle: string;
  student: { name: string; email: string };
  enrollment: { enrolledAt: string; progressPct: number; completedAt: string | null };
  weeks: {
    id: string;
    weekNumber: number;
    title: string;
    lessons: { id: string; title: string; completed: boolean; completedAt: string | null }[];
  }[];
  quizAttempts: {
    id: string;
    quizTitle: string;
    score: number | null;
    startedAt: string;
    submittedAt: string | null;
  }[];
  submissions: {
    id: string;
    assignmentTitle: string;
    maxScore: number;
    status: string;
    score: number | null;
    feedback: string | null;
    submittedAt: string | null;
  }[];
};

export function StudentHistory({ data, backHref }: { data: History; backHref: string }) {
  const totalLessons = data.weeks.reduce((s, w) => s + w.lessons.length, 0);
  const completedLessons = data.weeks.reduce(
    (s, w) => s + w.lessons.filter((l) => l.completed).length,
    0
  );
  const approvedTasks = data.submissions.filter((s) => s.status === "APROBADO").length;

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <Link href={backHref} className="text-xs font-medium text-slate-500 hover:text-indigo-600">
          ← Volver a alumnos
        </Link>
        <h1 className="mt-2 text-xl font-bold">{data.student.name}</h1>
        <p className="text-sm text-slate-600">
          {data.student.email} · {data.courseTitle}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Matriculado</p>
          <p className="mt-0.5 text-sm font-semibold">{dateFmt.format(new Date(data.enrollment.enrolledAt))}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Progreso</p>
          <p className="mt-0.5 text-lg font-bold">{data.enrollment.progressPct}%</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Lecciones vistas</p>
          <p className="mt-0.5 text-lg font-bold">
            {completedLessons}/{totalLessons}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Trabajos aprobados</p>
          <p className="mt-0.5 text-lg font-bold">{approvedTasks}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <p className="border-b border-slate-100 px-5 py-3 font-medium">Avance por semana</p>
        <div className="divide-y divide-slate-100">
          {data.weeks.map((w) => (
            <div key={w.id} className="px-5 py-3">
              <p className="text-sm font-medium">
                Semana {String(w.weekNumber).padStart(2, "0")}: {w.title}
              </p>
              <ul className="mt-2 space-y-1">
                {w.lessons.map((l) => (
                  <li key={l.id} className="flex items-center justify-between text-xs text-slate-600">
                    <span>{l.title}</span>
                    {l.completed ? (
                      <span className="text-green-600">
                        ✓ {l.completedAt ? dateFmt.format(new Date(l.completedAt)) : ""}
                      </span>
                    ) : (
                      <span className="text-slate-400">Pendiente</span>
                    )}
                  </li>
                ))}
                {w.lessons.length === 0 && (
                  <li className="text-xs text-slate-400">Sin lecciones</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <p className="border-b border-slate-100 px-5 py-3 font-medium">Evaluaciones rendidas</p>
        <ul className="divide-y divide-slate-100">
          {data.quizAttempts.map((a) => (
            <li key={a.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <div>
                <p className="font-medium">{a.quizTitle}</p>
                <p className="text-xs text-slate-500">
                  {a.submittedAt ? `Entregado ${formatDueDate(a.submittedAt)}` : "En curso"}
                </p>
              </div>
              {a.score !== null ? (
                <span className={a.score >= 11 ? "font-semibold text-green-700" : "font-semibold text-red-600"}>
                  {a.score} / 20
                </span>
              ) : (
                <span className="text-xs text-slate-400">Sin nota</span>
              )}
            </li>
          ))}
          {data.quizAttempts.length === 0 && (
            <li className="px-5 py-6 text-center text-sm text-slate-500">
              Todavía no rindió ninguna evaluación.
            </li>
          )}
        </ul>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <p className="border-b border-slate-100 px-5 py-3 font-medium">Tareas</p>
        <ul className="divide-y divide-slate-100">
          {data.submissions.map((s) => (
            <li key={s.id} className="px-5 py-3 text-sm">
              <div className="flex items-center justify-between">
                <p className="font-medium">{s.assignmentTitle}</p>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${SUBMISSION_STYLE[s.status]}`}>
                  {SUBMISSION_LABEL[s.status]}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {s.submittedAt ? `Entregado ${formatDueDate(s.submittedAt)}` : "Sin entregar"}
                {s.score !== null && ` · Nota: ${s.score} / ${s.maxScore}`}
              </p>
              {s.feedback && (
                <p className="mt-1 whitespace-pre-line rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700">
                  {s.feedback}
                </p>
              )}
            </li>
          ))}
          {data.submissions.length === 0 && (
            <li className="px-5 py-6 text-center text-sm text-slate-500">
              Este curso todavía no tiene tareas.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
