"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Question = {
  id: string;
  text: string;
  type: string;
  points: number;
  options: { id: string; text: string; correct: boolean }[];
};

type Attempt = {
  id: string;
  studentName: string;
  submittedAt: string | null;
  score: number | null;
  pendientes: number;
};

const TYPE_LABEL: Record<string, string> = {
  ALTERNATIVAS: "Alternativas",
  VERDADERO_FALSO: "Verdadero / Falso",
  ABIERTA: "Respuesta abierta",
};

const VF_OPTIONS = [
  { id: "v", text: "Verdadero", correct: true },
  { id: "f", text: "Falso", correct: false },
];

export function QuizEditor({
  quiz,
  questions,
  attempts,
  backHref,
  gradeBaseHref,
}: {
  quiz: {
    id: string;
    title: string;
    timeLimitMin: number | null;
    maxAttempts: number;
    showResults: boolean;
    courseTitle: string;
    moduleTitle: string;
  };
  questions: Question[];
  attempts: Attempt[];
  backHref: string;
  /** Ruta base para revisar un intento, p. ej. "/docente/intentos". */
  gradeBaseHref: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [settings, setSettings] = useState({
    title: quiz.title,
    timeLimitMin: quiz.timeLimitMin ? String(quiz.timeLimitMin) : "",
    maxAttempts: String(quiz.maxAttempts),
    showResults: quiz.showResults,
  });

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    text: "",
    type: "ALTERNATIVAS",
    points: "1",
    options: [
      { id: "a", text: "", correct: true },
      { id: "b", text: "", correct: false },
      { id: "c", text: "", correct: false },
      { id: "d", text: "", correct: false },
    ],
  });

  const refresh = () => startTransition(() => router.refresh());

  const request = async (url: string, method: string, body?: object) => {
    setError(null);
    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      // Sin conexión, servidor caído, etc.: no se deja el botón bloqueado.
      setError("No se pudo conectar con el servidor. Intenta de nuevo.");
      return false;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Ocurrió un error");
      return false;
    }
    return true;
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await request(`/api/quizzes/${quiz.id}`, "PATCH", {
      title: settings.title,
      timeLimitMin: settings.timeLimitMin ? Number(settings.timeLimitMin) : null,
      maxAttempts: Number(settings.maxAttempts),
      showResults: settings.showResults,
    });
    if (ok) refresh();
  };

  const addQuestion = async (e: React.FormEvent) => {
    e.preventDefault();

    const options =
      form.type === "ABIERTA"
        ? []
        : form.type === "VERDADERO_FALSO"
          ? VF_OPTIONS.map((o) => ({
              ...o,
              correct: o.id === form.options[0].id ? true : false,
            }))
          : form.options.filter((o) => o.text.trim() !== "");

    // Para V/F la alternativa correcta se elige con el desplegable de abajo.
    const finalOptions =
      form.type === "VERDADERO_FALSO"
        ? VF_OPTIONS.map((o) => ({
            ...o,
            correct: o.id === (form.options.find((x) => x.correct)?.id ?? "v"),
          }))
        : options;

    const ok = await request("/api/questions", "POST", {
      quizId: quiz.id,
      text: form.text,
      type: form.type,
      points: Number(form.points),
      options: finalOptions,
    });

    if (ok) {
      setForm({
        text: "",
        type: form.type,
        points: "1",
        options: [
          { id: "a", text: "", correct: true },
          { id: "b", text: "", correct: false },
          { id: "c", text: "", correct: false },
          { id: "d", text: "", correct: false },
        ],
      });
      setAdding(false);
      refresh();
    }
  };

  const deleteQuestion = async (q: Question) => {
    if (!confirm(`¿Eliminar la pregunta "${q.text.slice(0, 50)}..."?`)) return;
    if (await request(`/api/questions/${q.id}`, "DELETE")) refresh();
  };

  const field =
    "rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none";

  const totalPuntos = questions.reduce((s, q) => s + q.points, 0);

  return (
    <div className="space-y-5">
      <div>
        <Link
          href={backHref}
          className="text-xs font-medium text-slate-500 hover:text-indigo-600"
        >
          ← Volver al curso
        </Link>
        <h1 className="mt-2 text-xl font-bold">{quiz.title}</h1>
        <p className="text-sm text-slate-600">
          {quiz.courseTitle} · {quiz.moduleTitle} · {questions.length} pregunta(s)
          · {totalPuntos} punto(s)
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* ---------- Configuración ---------- */}
      <form
        onSubmit={saveSettings}
        className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <p className="font-medium">Configuración de la evaluación</p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs font-medium text-slate-600">
            Título
            <input
              required
              value={settings.title}
              onChange={(e) =>
                setSettings({ ...settings, title: e.target.value })
              }
              className={`mt-1 w-full ${field}`}
            />
          </label>

          <label className="text-xs font-medium text-slate-600">
            Tiempo límite (min)
            <input
              type="number"
              min={1}
              placeholder="Sin límite"
              value={settings.timeLimitMin}
              onChange={(e) =>
                setSettings({ ...settings, timeLimitMin: e.target.value })
              }
              className={`mt-1 w-full ${field}`}
            />
          </label>

          <label className="text-xs font-medium text-slate-600">
            Intentos permitidos
            <input
              type="number"
              min={1}
              max={20}
              required
              value={settings.maxAttempts}
              onChange={(e) =>
                setSettings({ ...settings, maxAttempts: e.target.value })
              }
              className={`mt-1 w-full ${field}`}
            />
          </label>

          <label className="flex items-end gap-2 text-xs font-medium text-slate-600">
            <input
              type="checkbox"
              checked={settings.showResults}
              onChange={(e) =>
                setSettings({ ...settings, showResults: e.target.checked })
              }
              className="mb-2.5 h-4 w-4"
            />
            <span className="mb-2">Mostrar resultados al alumno</span>
          </label>
        </div>

        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          Guardar configuración
        </button>
      </form>

      {/* ---------- Banco de preguntas ---------- */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <p className="font-medium">Banco de preguntas</p>
          <button
            onClick={() => setAdding((v) => !v)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
          >
            {adding ? "Cancelar" : "Añadir pregunta"}
          </button>
        </div>

        {adding && (
          <form
            onSubmit={addQuestion}
            className="space-y-3 border-b border-slate-100 bg-slate-50/60 p-5"
          >
            <textarea
              required
              rows={2}
              placeholder="Enunciado de la pregunta"
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              className={`w-full ${field}`}
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-xs font-medium text-slate-600">
                Tipo de pregunta
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className={`mt-1 w-full ${field}`}
                >
                  <option value="ALTERNATIVAS">Alternativas</option>
                  <option value="VERDADERO_FALSO">Verdadero / Falso</option>
                  <option value="ABIERTA">Respuesta abierta</option>
                </select>
              </label>

              <label className="text-xs font-medium text-slate-600">
                Puntaje
                <input
                  type="number"
                  min={1}
                  max={100}
                  required
                  value={form.points}
                  onChange={(e) => setForm({ ...form, points: e.target.value })}
                  className={`mt-1 w-full ${field}`}
                />
              </label>
            </div>

            {form.type === "ALTERNATIVAS" && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-600">
                  Alternativas (marca la correcta)
                </p>
                {form.options.map((opt, i) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correcta"
                      checked={opt.correct}
                      onChange={() =>
                        setForm({
                          ...form,
                          options: form.options.map((o, j) => ({
                            ...o,
                            correct: i === j,
                          })),
                        })
                      }
                      className="h-4 w-4 shrink-0"
                    />
                    <input
                      placeholder={`Alternativa ${opt.id.toUpperCase()}`}
                      value={opt.text}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          options: form.options.map((o, j) =>
                            i === j ? { ...o, text: e.target.value } : o
                          ),
                        })
                      }
                      className={`flex-1 ${field}`}
                    />
                  </div>
                ))}
                <p className="text-xs text-slate-400">
                  Deja vacías las que no uses; se guardan solo las que tengan
                  texto.
                </p>
              </div>
            )}

            {form.type === "VERDADERO_FALSO" && (
              <label className="block text-xs font-medium text-slate-600">
                Respuesta correcta
                <select
                  value={form.options.find((o) => o.correct)?.id ?? "a"}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      options: [
                        { id: "v", text: "Verdadero", correct: e.target.value === "v" },
                        { id: "f", text: "Falso", correct: e.target.value === "f" },
                      ],
                    })
                  }
                  className={`mt-1 w-full sm:w-64 ${field}`}
                >
                  <option value="v">Verdadero</option>
                  <option value="f">Falso</option>
                </select>
              </label>
            )}

            {form.type === "ABIERTA" && (
              <p className="rounded-lg bg-amber-50 px-4 py-2 text-xs text-amber-800">
                Las preguntas abiertas las calificas tú a mano después de que el
                alumno entregue.
              </p>
            )}

            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Guardar pregunta
            </button>
          </form>
        )}

        <ol className="divide-y divide-slate-100">
          {questions.map((q, i) => (
            <li key={q.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    <span className="text-slate-400">{i + 1}.</span> {q.text}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {TYPE_LABEL[q.type]} · {q.points} punto(s)
                  </p>

                  {q.options.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {q.options.map((o) => (
                        <li
                          key={o.id}
                          className={`text-xs ${
                            o.correct
                              ? "font-medium text-green-700"
                              : "text-slate-500"
                          }`}
                        >
                          {o.correct ? "✓" : "○"} {o.text}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <button
                  onClick={() => deleteQuestion(q)}
                  className="shrink-0 rounded border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
          {questions.length === 0 && (
            <li className="px-5 py-6 text-center text-sm text-slate-500">
              Aún no hay preguntas. Añade la primera para que los alumnos puedan
              rendir.
            </li>
          )}
        </ol>
      </div>

      {/* ---------- Resultados ---------- */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <p className="border-b border-slate-100 px-5 py-3 font-medium">
          Resultados de los alumnos
        </p>

        <ul className="divide-y divide-slate-100">
          {attempts.map((a) => (
            <li key={a.id} className="flex items-center gap-4 px-5 py-3 text-sm">
              <span className="flex-1">{a.studentName}</span>

              {a.submittedAt ? (
                <>
                  <span className="text-slate-500">
                    Nota:{" "}
                    <strong className="text-slate-800">
                      {a.score?.toFixed(2) ?? "—"}
                    </strong>{" "}
                    / 20
                  </span>
                  {a.pendientes > 0 && (
                    <Link
                      href={`${gradeBaseHref}/${a.id}`}
                      className="rounded bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 hover:bg-amber-200"
                    >
                      {a.pendientes} por revisar
                    </Link>
                  )}
                </>
              ) : (
                <span className="text-xs text-slate-400">En curso...</span>
              )}
            </li>
          ))}
          {attempts.length === 0 && (
            <li className="px-5 py-6 text-center text-sm text-slate-500">
              Todavía nadie ha rendido esta evaluación.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
