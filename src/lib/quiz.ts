import { prisma } from "@/lib/prisma";
import { canManageCourse } from "@/lib/course-access";

/** Alternativa de una pregunta cerrada, tal como se guarda en `options`. */
export type QuestionOption = {
  id: string;
  text: string;
  correct: boolean;
};

/** Lee el JSON de alternativas de forma tolerante a datos mal formados. */
export function parseOptions(raw: string | null): QuestionOption[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (o): o is QuestionOption =>
        typeof o?.id === "string" &&
        typeof o?.text === "string" &&
        typeof o?.correct === "boolean"
    );
  } catch {
    return [];
  }
}

/**
 * Alternativas sin la marca de cuál es correcta. Es lo único que puede viajar
 * al alumno mientras rinde: si mandáramos `correct`, la respuesta sería
 * visible en el código de la página.
 */
export function optionsForStudent(raw: string | null) {
  return parseOptions(raw).map(({ id, text }) => ({ id, text }));
}

/**
 * Califica una respuesta cerrada. Las preguntas abiertas devuelven null en
 * `isCorrect`: las revisa el docente a mano.
 */
export function gradeAnswer(
  question: { type: string; options: string | null; points: number },
  value: string
): { isCorrect: boolean | null; pointsGot: number | null } {
  if (question.type === "ABIERTA") {
    return { isCorrect: null, pointsGot: null };
  }

  const correcta = parseOptions(question.options).find((o) => o.correct);
  if (!correcta) return { isCorrect: null, pointsGot: null };

  const isCorrect = value === correcta.id;
  return { isCorrect, pointsGot: isCorrect ? question.points : 0 };
}

/** Permite gestionar una evaluación a administradores y al docente dueño. */
export async function canManageQuiz(quizId: string) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { module: { select: { courseId: true } } },
  });
  if (!quiz) return null;
  return canManageCourse(quiz.module.courseId);
}

/** Igual, pero partiendo de una pregunta. */
export async function canManageQuestion(questionId: string) {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: { quiz: { select: { module: { select: { courseId: true } } } } },
  });
  if (!question) return null;
  return canManageCourse(question.quiz.module.courseId);
}

/** ¿Se acabó el tiempo del intento? */
export function attemptExpired(
  startedAt: Date,
  timeLimitMin: number | null
): boolean {
  if (!timeLimitMin) return false;
  // Se conceden 15 s de gracia por la latencia del envío.
  const limite = startedAt.getTime() + timeLimitMin * 60_000 + 15_000;
  return Date.now() > limite;
}
