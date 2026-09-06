import Link from "next/link";
import { formatDueDate } from "@/lib/format";

type LessonItem = {
  id: string;
  title: string;
  type: string;
  completed: boolean;
};

type QuizItem = {
  id: string;
  title: string;
  questionCount: number;
  /** Mejor nota obtenida, o null si aún no ha rendido. */
  bestScore: number | null;
};

type AssignmentItem = {
  id: string;
  title: string;
  dueDate: string | null;
  status: string;
  score: number | null;
};

type ModuleItem = {
  id: string;
  title: string;
  lessons: LessonItem[];
  quizzes: QuizItem[];
  assignments: AssignmentItem[];
};

const TYPE_ICON: Record<string, string> = {
  VIDEO: "▶",
  PDF: "📄",
  PRESENTACION: "📊",
  ARCHIVO: "📎",
  LINK_EXTERNO: "🔗",
  ACTIVIDAD: "📝",
};

export function CourseSidebar({
  courseId,
  modules,
  activeLessonId,
  progressPct,
}: {
  courseId: string;
  modules: ModuleItem[];
  activeLessonId: string;
  progressPct: number;
}) {
  return (
    <aside className="flex w-full shrink-0 flex-col border-r border-slate-200 bg-white sm:w-80">
      <div className="border-b border-slate-200 p-4">
        <Link
          href="/alumno"
          className="text-xs font-medium text-slate-500 hover:text-indigo-600"
        >
          ← Volver a mis cursos
        </Link>
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
            <span>Progreso</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto">
        {modules.map((mod, i) => (
          <div key={mod.id} className="border-b border-slate-100">
            <p className="px-4 pt-4 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Semana {String(i + 1).padStart(2, "0")}: {mod.title}
            </p>
            <ul>
              {mod.lessons.map((lesson) => {
                const isActive = lesson.id === activeLessonId;
                return (
                  <li key={lesson.id}>
                    <Link
                      href={`/alumno/cursos/${courseId}?leccion=${lesson.id}`}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm transition ${
                        isActive
                          ? "border-l-2 border-indigo-600 bg-indigo-50 font-medium text-indigo-700"
                          : "border-l-2 border-transparent text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-base leading-none">
                        {TYPE_ICON[lesson.type] ?? "•"}
                      </span>
                      <span className="flex-1">{lesson.title}</span>
                      {lesson.completed && (
                        <span className="text-green-600" title="Completada">
                          ✓
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}

              {/* Evaluaciones del módulo, al final de sus lecciones. */}
              {mod.quizzes.map((quiz) => (
                <li key={quiz.id}>
                  <Link
                    href={`/alumno/evaluaciones/${quiz.id}`}
                    className="flex items-center gap-3 border-l-2 border-transparent px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                  >
                    <span className="text-base leading-none">🧠</span>
                    <span className="flex-1">
                      {quiz.title}
                      <span className="block text-[11px] text-slate-400">
                        {quiz.questionCount} pregunta(s)
                      </span>
                    </span>
                    {quiz.bestScore !== null && (
                      <span
                        className={`text-xs font-semibold ${
                          quiz.bestScore >= 11
                            ? "text-green-600"
                            : "text-red-500"
                        }`}
                        title="Tu mejor nota"
                      >
                        {quiz.bestScore.toFixed(0)}
                      </span>
                    )}
                  </Link>
                </li>
              ))}

              {/* Tareas del módulo. */}
              {mod.assignments.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/alumno/tareas/${a.id}`}
                    className="flex items-center gap-3 border-l-2 border-transparent px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
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
                      <span className="text-xs font-semibold text-green-600">
                        {a.score}
                      </span>
                    ) : a.status === "REQUIERE_CORRECCION" ? (
                      <span className="text-xs font-semibold text-red-600">
                        Corregir
                      </span>
                    ) : a.status === "SIN_ENVIAR" || a.status === "BORRADOR" ? (
                      <span className="text-xs text-slate-400">Pendiente</span>
                    ) : (
                      <span className="text-xs text-amber-600">Entregada</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
