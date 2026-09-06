import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Inicia un intento de evaluación. Valida matrícula y número de intentos.
 * Si ya hay uno sin entregar, lo reutiliza en vez de crear otro (así recargar
 * la página no consume un intento).
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ALUMNO") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id: quizId } = await params;
  const studentId = session.user.id;

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: {
      maxAttempts: true,
      module: { select: { courseId: true } },
      _count: { select: { questions: true } },
    },
  });
  if (!quiz) {
    return NextResponse.json({ error: "Evaluación no encontrada" }, { status: 404 });
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      courseId_studentId: { courseId: quiz.module.courseId, studentId },
    },
  });
  if (!enrollment) {
    return NextResponse.json(
      { error: "No estás matriculado en este curso" },
      { status: 403 }
    );
  }

  if (quiz._count.questions === 0) {
    return NextResponse.json(
      { error: "La evaluación aún no tiene preguntas" },
      { status: 400 }
    );
  }

  const enCurso = await prisma.quizAttempt.findFirst({
    where: { quizId, studentId, submittedAt: null },
    orderBy: { startedAt: "desc" },
  });
  if (enCurso) {
    return NextResponse.json({ ok: true, id: enCurso.id, reanudado: true });
  }

  const entregados = await prisma.quizAttempt.count({
    where: { quizId, studentId, submittedAt: { not: null } },
  });
  if (entregados >= quiz.maxAttempts) {
    return NextResponse.json(
      { error: "Ya agotaste los intentos disponibles" },
      { status: 409 }
    );
  }

  const attempt = await prisma.quizAttempt.create({
    data: { quizId, studentId },
  });

  return NextResponse.json({ ok: true, id: attempt.id });
}
