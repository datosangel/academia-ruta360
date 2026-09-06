import { prisma } from "@/lib/prisma";

/** Carga un curso con sus módulos y lecciones ordenados, para el editor. */
export async function loadCourseContent(courseId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      announcements: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { name: true } } },
      },
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: { orderBy: { order: "asc" } },
          quizzes: {
            orderBy: { title: "asc" },
            include: { _count: { select: { questions: true } } },
          },
          assignments: {
            orderBy: { createdAt: "asc" },
            include: {
              submissions: { select: { status: true } },
            },
          },
        },
      },
    },
  });
  if (!course) return null;

  return {
    id: course.id,
    title: course.title,
    teacherId: course.teacherId,
    announcements: course.announcements.map((a) => ({
      id: a.id,
      title: a.title,
      body: a.body,
      authorName: a.author.name,
      createdAt: a.createdAt.toISOString(),
    })),
    modules: course.modules.map((m) => ({
      id: m.id,
      title: m.title,
      lessons: m.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        type: l.type,
        contentUrl: l.contentUrl,
        body: l.body,
      })),
      quizzes: m.quizzes.map((q) => ({
        id: q.id,
        title: q.title,
        questionCount: q._count.questions,
      })),
      assignments: m.assignments.map((a) => ({
        id: a.id,
        title: a.title,
        dueDate: a.dueDate?.toISOString() ?? null,
        submissionCount: a.submissions.length,
        pendingCount: a.submissions.filter((s) => s.status === "ENTREGADO").length,
      })),
    })),
  };
}
