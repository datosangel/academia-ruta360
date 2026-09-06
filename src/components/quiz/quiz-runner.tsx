"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type Question = {
  id: string;
  text: string;
  type: string;
  points: number;
  /** Sin la marca de cuál es correcta: eso no viaja al navegador. */
  options: { id: string; text: string }[];
};

export function QuizRunner({
  attemptId,
  quizTitle,
  questions,
  /** Instante límite en ISO, o null si la evaluación no tiene tiempo. */
  deadline,
  backHref,
}: {
  attemptId: string;
  quizTitle: string;
  questions: Question[];
  deadline: string | null;
  backHref: string;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [left, setLeft] = useState<number | null>(null);
  const submitted = useRef(false);

  // Espejo de las respuestas para que la entrega automática por tiempo
  // agotado mande siempre lo último escrito, sin depender del cierre.
  const answersRef = useRef<Record<string, string>>({});

  const enviar = useCallback(
    async (automatico = false) => {
      if (submitted.current) return;
      if (
        !automatico &&
        !confirm("¿Entregar la evaluación? No podrás cambiar tus respuestas.")
      )
        return;

      submitted.current = true;
      setSending(true);
      setError(null);

      const res = await fetch(`/api/attempts/${attemptId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: answersRef.current }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "No se pudo entregar");
        submitted.current = false;
        setSending(false);
        return;
      }

      router.push(`${backHref}?entregado=1`);
      router.refresh();
    },
    [attemptId, backHref, router]
  );

  // Cuenta atrás calculada contra el instante límite, no restando segundos:
  // así no se desfasa aunque la pestaña quede en segundo plano.
  useEffect(() => {
    if (!deadline) return;
    const fin = new Date(deadline).getTime();

    const tick = () => {
      const resto = Math.max(0, Math.round((fin - Date.now()) / 1000));
      setLeft(resto);
      if (resto === 0) {
        clearInterval(intervalo);
        void enviar(true);
      }
    };

    // El primer tick va en un callback, no en el cuerpo del efecto.
    const primero = setTimeout(tick, 0);
    const intervalo = setInterval(tick, 1000);

    return () => {
      clearTimeout(primero);
      clearInterval(intervalo);
    };
  }, [deadline, enviar]);

  const responder = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    answersRef.current = { ...answersRef.current, [questionId]: value };
  };

  const respondidas = questions.filter((q) => answers[q.id]?.trim()).length;

  const mm = left === null ? null : Math.floor(left / 60);
  const ss = left === null ? null : left % 60;
  const apurado = left !== null && left <= 60;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      {/* ---------- Cabecera fija con temporizador ---------- */}
      <div className="sticky top-0 z-10 -mx-4 mb-6 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold">{quizTitle}</h1>
            <p className="text-xs text-slate-500">
              {respondidas} de {questions.length} respondidas
            </p>
          </div>

          {left !== null && (
            <span
              className={`rounded-lg px-4 py-2 font-mono text-lg font-semibold tabular-nums ${
                apurado
                  ? "animate-pulse bg-red-100 text-red-700"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
            </span>
          )}
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <ol className="space-y-4">
        {questions.map((q, i) => (
          <li
            key={q.id}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium">
              <span className="text-slate-400">{i + 1}.</span> {q.text}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {q.points} punto(s)
            </p>

            {q.type === "ABIERTA" ? (
              <textarea
                rows={4}
                value={answers[q.id] ?? ""}
                onChange={(e) => responder(q.id, e.target.value)}
                placeholder="Escribe tu respuesta"
                className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            ) : (
              <div className="mt-3 space-y-2">
                {q.options.map((o) => (
                  <label
                    key={o.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-2.5 text-sm transition ${
                      answers[q.id] === o.id
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      checked={answers[q.id] === o.id}
                      onChange={() => responder(q.id, o.id)}
                      className="h-4 w-4"
                    />
                    {o.text}
                  </label>
                ))}
              </div>
            )}
          </li>
        ))}
      </ol>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          onClick={() => enviar(false)}
          disabled={sending}
          className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
        >
          {sending ? "Entregando..." : "Entregar evaluación"}
        </button>

        {respondidas < questions.length && (
          <span className="text-sm text-amber-700">
            Te faltan {questions.length - respondidas} pregunta(s) por responder.
          </span>
        )}
      </div>
    </div>
  );
}
