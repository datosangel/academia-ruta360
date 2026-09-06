import { prisma } from "@/lib/prisma";

/** Carga la lista de alumnos matriculados en un curso, con su avance. */
export async function loadCourseRoster(courseId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      title: true,
      teacherId: true,
      enrollments: {
        orderBy: { student: { name: "asc" } },
        include: { student: { select: { id: true, name: true, email: true } } },
      },
    },
  });
  if (!course) return null;

  // Notas de evaluaciones y tareas, para el promedio de cada alumno.
  const studentIds = course.enrollments.map((e) => e.studentId);
  const [quizScores, taskScores] = await Promise.all([
    prisma.quizAttempt.findMany({
      where: {
        studentId: { in: studentIds },
        quiz: { module: { courseId } },
        score: { not: null },
      },
      select: { studentId: true, score: true },
    }),
    prisma.submission.findMany({
      where: {
        studentId: { in: studentIds },
        assignment: { module: { courseId } },
        score: { not: null },
      },
      select: { studentId: true, score: true, assignment: { select: { maxScore: true } } },
    }),
  ]);

  const notasPorAlumno = new Map<string, number[]>();
  for (const q of quizScores) {
    // Las notas de evaluación ya están sobre 20.
    const arr = notasPorAlumno.get(q.studentId) ?? [];
    arr.push(q.score!);
    notasPorAlumno.set(q.studentId, arr);
  }
  for (const t of taskScores) {
    // Las tareas se normalizan a 20 para promediar junto a las evaluaciones.
    const sobre20 = (t.score! / t.assignment.maxScore) * 20;
    const arr = notasPorAlumno.get(t.studentId) ?? [];
    arr.push(sobre20);
    notasPorAlumno.set(t.studentId, arr);
  }

  return {
    courseTitle: course.title,
    teacherId: course.teacherId,
    students: course.enrollments.map((e) => {
      const notas = notasPorAlumno.get(e.studentId) ?? [];
      const promedio =
        notas.length > 0
          ? Math.round((notas.reduce((s, n) => s + n, 0) / notas.length) * 100) / 100
          : null;

      return {
        id: e.student.id,
        enrollmentId: e.id,
        name: e.student.name,
        email: e.student.email,
        progressPct: e.progressPct,
        promedio,
        enrolledAt: e.enrolledAt.toISOString(),
        completedAt: e.completedAt?.toISOString() ?? null,
      };
    }),
  };
}
