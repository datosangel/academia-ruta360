import { prisma } from "@/lib/prisma";

/** Ficha CRM de un usuario: todo lo que tiene en la plataforma, en un solo lugar. */
export async function loadUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      documentId: true,
      bio: true,
      active: true,
      createdAt: true,
    },
  });
  if (!user) return null;

  const [enrollments, coursesTaught, submissions, quizAttempts] = await Promise.all([
    prisma.enrollment.findMany({
      where: { studentId: userId },
      orderBy: { enrolledAt: "desc" },
      include: { course: { select: { id: true, title: true } } },
    }),
    user.role === "DOCENTE"
      ? prisma.course.findMany({
          where: { teacherId: userId },
          select: { id: true, title: true, status: true, _count: { select: { enrollments: true } } },
        })
      : Promise.resolve([]),
    prisma.submission.count({ where: { studentId: userId, status: "APROBADO" } }),
    prisma.quizAttempt.count({ where: { studentId: userId, submittedAt: { not: null } } }),
  ]);

  return {
    ...user,
    createdAt: user.createdAt.toISOString(),
    enrollments: enrollments.map((e) => ({
      courseId: e.course.id,
      courseTitle: e.course.title,
      progressPct: e.progressPct,
      enrolledAt: e.enrolledAt.toISOString(),
      completedAt: e.completedAt?.toISOString() ?? null,
    })),
    coursesTaught: coursesTaught.map((c) => ({
      id: c.id,
      title: c.title,
      status: c.status,
      studentCount: c._count.enrollments,
    })),
    approvedTasks: submissions,
    quizzesTaken: quizAttempts,
  };
}
