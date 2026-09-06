import { prisma } from "@/lib/prisma";

/** Carga todo lo que necesita la vista con pestañas del curso para un alumno. */
export async function loadCourseForStudent(courseId: string, studentId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      category: true,
      teacher: { select: { name: true, email: true } },
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            include: { progress: { where: { studentId } } },
          },
          quizzes: {
            orderBy: { title: "asc" },
            include: {
              _count: { select: { questions: true } },
              attempts: {
                where: { studentId, submittedAt: { not: null } },
                select: { score: true },
              },
            },
          },
          assignments: {
            orderBy: { createdAt: "asc" },
            include: { submissions: { where: { studentId } } },
          },
        },
      },
    },
  });
  if (!course) return null;

  // Cada módulo se presenta como una semana: se numeran en el orden en que
  // el docente las creó (campo `order`), sin necesidad de un dato nuevo.
  const weeks = course.modules.map((m, i) => ({
    id: m.id,
    weekNumber: i + 1,
    title: m.title,
    lessons: m.lessons.map((l) => ({
      id: l.id,
      title: l.title,
      type: l.type,
      completed: l.progress[0]?.completed ?? false,
    })),
    quizzes: m.quizzes.map((q) => {
      const notas = q.attempts.map((a) => a.score).filter((s): s is number => s !== null);
      return {
        id: q.id,
        title: q.title,
        questionCount: q._count.questions,
        bestScore: notas.length > 0 ? Math.max(...notas) : null,
      };
    }),
    assignments: m.assignments.map((a) => ({
      id: a.id,
      title: a.title,
      dueDate: a.dueDate?.toISOString() ?? null,
      status: a.submissions[0]?.status ?? "SIN_ENVIAR",
      score: a.submissions[0]?.score ?? null,
      maxScore: a.maxScore,
    })),
  }));

  const allQuizzes = weeks.flatMap((w) =>
    w.quizzes.map((q) => ({ ...q, weekNumber: w.weekNumber, weekTitle: w.title }))
  );
  const allAssignments = weeks.flatMap((w) =>
    w.assignments.map((a) => ({ ...a, weekNumber: w.weekNumber, weekTitle: w.title }))
  );

  return {
    id: course.id,
    title: course.title,
    description: course.description,
    level: course.level,
    durationHrs: course.durationHrs,
    status: course.status,
    categoryName: course.category?.name ?? null,
    teacherName: course.teacher.name,
    teacherEmail: course.teacher.email,
    startDate: course.startDate?.toISOString() ?? null,
    endDate: course.endDate?.toISOString() ?? null,
    weeks,
    allQuizzes,
    allAssignments,
  };
}
