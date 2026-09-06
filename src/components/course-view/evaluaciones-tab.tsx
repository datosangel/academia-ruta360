import Link from "next/link";

type Quiz = {
  id: string;
  title: string;
  questionCount: number;
  bestScore: number | null;
  weekNumber: number;
  weekTitle: string;
};

export function EvaluacionesTab({ quizzes }: { quizzes: Quiz[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <ul className="divide-y divide-slate-100">
        {quizzes.map((q) => (
          <li key={q.id}>
            <Link
              href={`/alumno/evaluaciones/${q.id}`}
              className="flex items-center gap-3 px-5 py-4 text-sm transition hover:bg-slate-50"
            >
              <span className="text-lg leading-none">🧠</span>
              <span className="flex-1">
                <span className="block font-medium">{q.title}</span>
                <span className="block text-xs text-slate-500">
                  Semana {q.weekNumber} · {q.weekTitle} · {q.questionCount} pregunta(s)
                </span>
              </span>
              {q.bestScore !== null ? (
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    q.bestScore >= 11
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {q.bestScore.toFixed(1)} / 20
                </span>
              ) : (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                  Sin rendir
                </span>
              )}
            </Link>
          </li>
        ))}
        {quizzes.length === 0 && (
          <li className="px-5 py-8 text-center text-sm text-slate-500">
            Este curso todavía no tiene evaluaciones.
          </li>
        )}
      </ul>
    </div>
  );
}
