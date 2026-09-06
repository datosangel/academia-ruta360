type Quiz = { id: string; title: string; bestScore: number | null };
type Assignment = { id: string; title: string; score: number | null; status: string; maxScore: number };

function Nota({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-xs text-slate-400">Pendiente</span>;
  }
  return (
    <span className={value >= 11 ? "font-semibold text-green-700" : "font-semibold text-red-600"}>
      {value.toFixed(2)}
    </span>
  );
}

export function NotasTab({ quizzes, assignments }: { quizzes: Quiz[]; assignments: Assignment[] }) {
  const notasQuiz = quizzes.map((q) => q.bestScore).filter((s): s is number => s !== null);
  const notasTarea = assignments
    .filter((a) => a.score !== null)
    .map((a) => (a.score! / a.maxScore) * 20);
  const todas = [...notasQuiz, ...notasTarea];
  const promedio = todas.length > 0 ? todas.reduce((s, n) => s + n, 0) / todas.length : null;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-500">Promedio del curso</p>
        <p className="mt-1 text-3xl font-bold">
          {promedio !== null ? promedio.toFixed(2) : "—"}
          <span className="text-base font-normal text-slate-400"> / 20</span>
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <p className="border-b border-slate-100 px-5 py-3 font-medium">Evaluaciones</p>
        <ul className="divide-y divide-slate-100">
          {quizzes.map((q) => (
            <li key={q.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <span>{q.title}</span>
              <Nota value={q.bestScore} />
            </li>
          ))}
          {quizzes.length === 0 && (
            <li className="px-5 py-4 text-center text-sm text-slate-500">Sin evaluaciones.</li>
          )}
        </ul>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <p className="border-b border-slate-100 px-5 py-3 font-medium">Tareas</p>
        <ul className="divide-y divide-slate-100">
          {assignments.map((a) => (
            <li key={a.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <span>{a.title}</span>
              <Nota value={a.score !== null ? (a.score / a.maxScore) * 20 : null} />
            </li>
          ))}
          {assignments.length === 0 && (
            <li className="px-5 py-4 text-center text-sm text-slate-500">Sin tareas.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
