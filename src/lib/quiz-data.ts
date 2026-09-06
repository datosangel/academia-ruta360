import { prisma } from "@/lib/prisma";
import { parseOptions } from "@/lib/quiz";

/** Carga una evaluación con su banco de preguntas y los intentos rendidos. */
export async function loadQuizForEditor(quizId: string) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: { orderBy: { order: "asc" } },
      module: {
        select: {
          title: true,
          courseId: true,
          course: { select: { title: true, teacherId: true } },
        },
      },
      attempts: {
        orderBy: { startedAt: "desc" },
        include: {
          student: { select: { name: true } },
          answers: { select: { pointsGot: true, question: { select: { type: true } } } },
        },
      },
    },
  });
  if (!quiz) return null;

  return {
    courseId: quiz.module.courseId,
    teacherId: quiz.module.course.teacherId,
    quiz: {
      id: quiz.id,
      title: quiz.title,
      timeLimitMin: quiz.timeLimitMin,
      maxAttempts: quiz.maxAttempts,
      showResults: quiz.showResults,
      courseTitle: quiz.module.course.title,
      moduleTitle: quiz.module.title,
    },
    questions: quiz.questions.map((q) => ({
      id: q.id,
      text: q.text,
      type: q.type,
      points: q.points,
      options: parseOptions(q.options),
    })),
    attempts: quiz.attempts.map((a) => ({
      id: a.id,
      studentName: a.student.name,
      submittedAt: a.submittedAt?.toISOString() ?? null,
      score: a.score,
      // Preguntas abiertas todavía sin puntaje asignado por el docente.
      pendientes: a.answers.filter(
        (ans) => ans.question.type === "ABIERTA" && ans.pointsGot === null
      ).length,
    })),
  };
}
