import { prisma } from "@/lib/prisma";

/** Todo lo que un alumno hizo dentro de un curso puntual, para el docente/admin. */
export async function loadStudentHistory(courseId: string, studentId: string) {
  const [course, student, enrollment] = await Promise.all([
    prisma.course.findUnique({
      where: { id: courseId },
      select: {
        title: true,
        teacherId: true,
        modules: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            lessons: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                title: true,
                progress: { where: { studentId }, select: { completed: true, completedAt: true } },
              },
            },
          },
        },
      },
    }),
    prisma.user.findUnique({
      where: { id: studentId },
      select: { name: true, email: true },
    }),
    prisma.enrollment.findUnique({
      where: { courseId_studentId: { courseId, studentId } },
    }),
  ]);
  if (!course || !student || !enrollment) return null;

  const [quizAttempts, submissions] = await Promise.all([
    prisma.quizAttempt.findMany({
      where: { studentId, quiz: { module: { courseId } } },
      include: { quiz: { select: { title: true } } },
      orderBy: { startedAt: "desc" },
    }),
    prisma.submission.findMany({
      where: { studentId, assignment: { module: { courseId } } },
      include: { assignment: { select: { title: true, maxScore: true } } },
      orderBy: { submittedAt: "desc" },
    }),
  ]);

  return {
    courseTitle: course.title,
    teacherId: course.teacherId,
    student: { name: student.name, email: student.email },
    enrollment: {
      enrolledAt: enrollment.enrolledAt.toISOString(),
      progressPct: enrollment.progressPct,
      completedAt: enrollment.completedAt?.toISOString() ?? null,
    },
    weeks: course.modules.map((m, i) => ({
      id: m.id,
      weekNumber: i + 1,
      title: m.title,
      lessons: m.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        completed: l.progress[0]?.completed ?? false,
        completedAt: l.progress[0]?.completedAt?.toISOString() ?? null,
      })),
    })),
    quizAttempts: quizAttempts.map((a) => ({
      id: a.id,
      quizTitle: a.quiz.title,
      score: a.score,
      startedAt: a.startedAt.toISOString(),
      submittedAt: a.submittedAt?.toISOString() ?? null,
    })),
    submissions: submissions.map((s) => ({
      id: s.id,
      assignmentTitle: s.assignment.title,
      maxScore: s.assignment.maxScore,
      status: s.status,
      score: s.score,
      feedback: s.feedback,
      submittedAt: s.submittedAt?.toISOString() ?? null,
    })),
  };
}
