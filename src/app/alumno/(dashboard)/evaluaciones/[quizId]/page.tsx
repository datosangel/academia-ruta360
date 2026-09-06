import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { optionsForStudent, parseOptions } from "@/lib/quiz";
import { QuizRunner } from "@/components/quiz/quiz-runner";
import { StartAttemptButton } from "@/components/quiz/start-attempt-button";

const dateFmt = new Intl.DateTimeFormat("es", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function EvaluacionPage({
  params,
  searchParams,
}: {
  params: Promise<{ quizId: string }>;
  searchParams: Promise<{ rendir?: string }>;
}) {
  const session = await auth();
  const studentId = session!.user.id;
  const { quizId } = await params;
  const { rendir } = await searchParams;

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: { orderBy: { order: "asc" } },
      module: {
        select: { title: true, courseId: true, course: { select: { title: true } } },
      },
    },
  });
  if (!quiz) notFound();

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      courseId_studentId: { courseId: quiz.module.courseId, studentId },
    },
  });
  if (!enrollment) redirect("/alumno");

  const cursoHref = `/alumno/cursos/${quiz.module.courseId}`;

  const attempts = await prisma.quizAttempt.findMany({
    where: { quizId, studentId },
    orderBy: { startedAt: "desc" },
    include: {
      answers: {
        include: { question: { select: { id: true, text: true, type: true, points: true, options: true } } },
      },
    },
  });

  const enCurso = attempts.find((a) => !a.submittedAt);
  const entregados = attempts.filter((a) => a.submittedAt);
  const intentosRestantes = quiz.maxAttempts - entregados.length;

  // ---------- Rindiendo ----------
  if (rendir === "1" && enCurso) {
    // Se envía el instante límite y el navegador calcula la cuenta atrás:
    // así el reloj sigue corriendo aunque la página tarde en cargar.
    const deadline = quiz.timeLimitMin
      ? new Date(
          enCurso.startedAt.getTime() + quiz.timeLimitMin * 60_000
        ).toISOString()
      : null;

    return (
      <QuizRunner
        attemptId={enCurso.id}
        quizTitle={quiz.title}
        deadline={deadline}
        backHref={`/alumno/evaluaciones/${quiz.id}`}
        questions={quiz.questions.map((q) => ({
          id: q.id,
          text: q.text,
          type: q.type,
          points: q.points,
          options: optionsForStudent(q.options),
        }))}
      />
    );
  }

  // ---------- Portada / resultados ----------
  const ultimo = entregados[0];
  const totalPuntos = quiz.questions.reduce((s, q) => s + q.points, 0);

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-6">
      <div>
        <Link
          href={cursoHref}
          className="text-xs font-medium text-slate-500 hover:text-indigo-600"
        >
          ← Volver al curso
        </Link>
        <h1 className="mt-2 text-xl font-bold">{quiz.title}</h1>
        <p className="text-sm text-slate-600">
          {quiz.module.course.title} · {quiz.module.title}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Preguntas</p>
          <p className="mt-0.5 text-lg font-bold">{quiz.questions.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Puntaje total</p>
          <p className="mt-0.5 text-lg font-bold">{totalPuntos}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Tiempo límite</p>
          <p className="mt-0.5 text-lg font-bold">
            {quiz.timeLimitMin ? `${quiz.timeLimitMin} min` : "Sin límite"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Intentos restantes</p>
          <p className="mt-0.5 text-lg font-bold">
            {Math.max(0, intentosRestantes)} de {quiz.maxAttempts}
          </p>
        </div>
      </div>

      {quiz.questions.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
          Esta evaluación todavía no tiene preguntas.
        </p>
      ) : (
        <StartAttemptButton
          quizId={quiz.id}
          hayIntentoEnCurso={!!enCurso}
          sinIntentos={intentosRestantes <= 0}
        />
      )}

      {/* ---------- Historial ---------- */}
      {entregados.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <p className="border-b border-slate-100 px-5 py-3 font-medium">
            Tus intentos
          </p>
          <ul className="divide-y divide-slate-100">
            {entregados.map((a) => {
              // Si quedan preguntas abiertas sin puntaje, la nota todavía no
              // es la definitiva: se calcula solo sobre lo autocalificado.
              const porRevisar = a.answers.filter(
                (ans) => ans.question.type === "ABIERTA" && ans.pointsGot === null
              ).length;

              return (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-sm"
                >
                  <span className="flex-1 text-slate-600">
                    {dateFmt.format(a.submittedAt!)}
                  </span>

                  <span>
                    {porRevisar > 0 ? "Nota parcial: " : "Nota: "}
                    <strong
                      className={
                        porRevisar > 0
                          ? "text-slate-700"
                          : (a.score ?? 0) >= 11
                            ? "text-green-700"
                            : "text-red-600"
                      }
                    >
                      {a.score?.toFixed(2) ?? "—"}
                    </strong>{" "}
                    / 20
                  </span>

                  {porRevisar > 0 && (
                    <span className="w-full text-xs text-amber-700 sm:w-auto">
                      Falta que el docente revise {porRevisar} pregunta(s)
                      abierta(s); la nota puede cambiar.
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* ---------- Revisión de la última entrega ---------- */}
      {ultimo && quiz.showResults && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-3 font-medium">Revisión de tu último intento</p>

          <ol className="space-y-4">
            {ultimo.answers.map((ans, i) => {
              const opciones = parseOptions(ans.question.options);
              const correcta = opciones.find((o) => o.correct);
              const elegida = opciones.find((o) => o.id === ans.value);
              const abierta = ans.question.type === "ABIERTA";

              return (
                <li key={ans.id} className="border-b border-slate-100 pb-4 last:border-0">
                  <p className="text-sm font-medium">
                    <span className="text-slate-400">{i + 1}.</span>{" "}
                    {ans.question.text}
                  </p>

                  {abierta ? (
                    <div className="mt-2 space-y-1 text-sm">
                      <p className="rounded-lg bg-slate-50 px-3 py-2 text-slate-700">
                        {ans.value || <em className="text-slate-400">Sin responder</em>}
                      </p>
                      <p className="text-xs">
                        {ans.pointsGot === null ? (
                          <span className="text-amber-700">
                            Pendiente de revisión del docente
                          </span>
                        ) : (
                          <span className="text-slate-600">
                            Puntaje: {ans.pointsGot} de {ans.question.points}
                          </span>
                        )}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-2 space-y-1 text-sm">
                      <p
                        className={
                          ans.isCorrect ? "text-green-700" : "text-red-600"
                        }
                      >
                        {ans.isCorrect ? "✓" : "✗"} Tu respuesta:{" "}
                        {elegida?.text ?? (
                          <em className="text-slate-400">Sin responder</em>
                        )}
                      </p>
                      {!ans.isCorrect && correcta && (
                        <p className="text-green-700">
                          Respuesta correcta: {correcta.text}
                        </p>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {ultimo && !quiz.showResults && (
        <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
          El docente configuró esta evaluación para no mostrar el detalle de las
          respuestas.
        </p>
      )}
    </div>
  );
}
