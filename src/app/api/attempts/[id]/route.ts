import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { attemptExpired, canManageQuiz, gradeAnswer } from "@/lib/quiz";

const submitSchema = z.object({
  answers: z.record(z.string(), z.string()),
});

const gradeSchema = z.object({
  grades: z.record(z.string(), z.coerce.number().min(0)),
});

/**
 * Entrega el intento: guarda las respuestas y califica automáticamente las
 * preguntas cerradas. Las abiertas quedan pendientes de revisión del docente.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const attempt = await prisma.quizAttempt.findUnique({
    where: { id },
    include: {
      quiz: { include: { questions: true } },
    },
  });
  if (!attempt || attempt.studentId !== session.user.id) {
    return NextResponse.json({ error: "Intento no encontrado" }, { status: 404 });
  }
  if (attempt.submittedAt) {
    return NextResponse.json(
      { error: "Este intento ya fue entregado" },
      { status: 409 }
    );
  }

  const parsed = submitSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
  const { answers } = parsed.data;

  // Si se acabó el tiempo igual se entrega: se califica lo respondido hasta
  // ahí, en lugar de perder el intento completo.
  const fueraDeTiempo = attemptExpired(
    attempt.startedAt,
    attempt.quiz.timeLimitMin
  );

  let obtenido = 0;
  let totalCerradas = 0;
  let hayAbiertas = false;

  for (const question of attempt.quiz.questions) {
    const value = answers[question.id] ?? "";
    const { isCorrect, pointsGot } = gradeAnswer(question, value);

    if (question.type === "ABIERTA") {
      hayAbiertas = true;
    } else {
      totalCerradas += question.points;
      obtenido += pointsGot ?? 0;
    }

    await prisma.answer.create({
      data: { attemptId: id, questionId: question.id, value, isCorrect, pointsGot },
    });
  }

  // La nota se expresa sobre 20, como es habitual en Perú. Mientras haya
  // preguntas abiertas sin revisar, es una nota parcial.
  const score = totalCerradas > 0 ? (obtenido / totalCerradas) * 20 : 0;

  await prisma.quizAttempt.update({
    where: { id },
    data: { submittedAt: new Date(), score: Math.round(score * 100) / 100 },
  });

  return NextResponse.json({
    ok: true,
    score: Math.round(score * 100) / 100,
    pendienteRevision: hayAbiertas,
    fueraDeTiempo,
  });
}

/** El docente califica las preguntas abiertas y se recalcula la nota. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const attempt = await prisma.quizAttempt.findUnique({
    where: { id },
    include: {
      quiz: { include: { questions: true } },
      answers: true,
    },
  });
  if (!attempt) {
    return NextResponse.json({ error: "Intento no encontrado" }, { status: 404 });
  }

  if (!(await canManageQuiz(attempt.quizId))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const parsed = gradeSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const byId = new Map(attempt.quiz.questions.map((q) => [q.id, q]));

  for (const [answerId, puntos] of Object.entries(parsed.data.grades)) {
    const answer = attempt.answers.find((a) => a.id === answerId);
    if (!answer) continue;

    const question = byId.get(answer.questionId);
    if (!question || question.type !== "ABIERTA") continue;

    const acotado = Math.min(puntos, question.points);
    await prisma.answer.update({
      where: { id: answerId },
      data: { pointsGot: acotado, isCorrect: acotado >= question.points },
    });
  }

  // Recalcula la nota con todas las preguntas ya calificadas.
  const answers = await prisma.answer.findMany({ where: { attemptId: id } });
  const totalPuntos = attempt.quiz.questions.reduce((s, q) => s + q.points, 0);
  const obtenido = answers.reduce((s, a) => s + (a.pointsGot ?? 0), 0);
  const score = totalPuntos > 0 ? (obtenido / totalPuntos) * 20 : 0;

  await prisma.quizAttempt.update({
    where: { id },
    data: { score: Math.round(score * 100) / 100 },
  });

  return NextResponse.json({ ok: true, score: Math.round(score * 100) / 100 });
}
