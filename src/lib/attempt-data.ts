import { prisma } from "@/lib/prisma";

/** Carga un intento con sus respuestas, para la pantalla de calificación. */
export async function loadAttemptForGrading(attemptId: string) {
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      student: { select: { name: true } },
      quiz: {
        select: {
          id: true,
          title: true,
          module: { select: { course: { select: { teacherId: true } } } },
        },
      },
      answers: {
        include: {
          question: { select: { text: true, type: true, points: true, order: true } },
        },
      },
    },
  });
  if (!attempt) return null;

  return {
    quizId: attempt.quiz.id,
    teacherId: attempt.quiz.module.course.teacherId,
    attemptId: attempt.id,
    studentName: attempt.student.name,
    quizTitle: attempt.quiz.title,
    score: attempt.score,
    answers: attempt.answers
      .sort((a, b) => a.question.order - b.question.order)
      .map((a) => ({
        id: a.id,
        questionText: a.question.text,
        questionType: a.question.type,
        maxPoints: a.question.points,
        value: a.value,
        pointsGot: a.pointsGot,
        isCorrect: a.isCorrect,
      })),
  };
}
