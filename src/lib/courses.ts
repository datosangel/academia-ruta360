import { prisma } from "@/lib/prisma";

/**
 * Carga los cursos (todos, o los de un docente) junto con los catálogos que
 * necesita el formulario de gestión.
 */
export async function loadCourseManagerData(teacherId?: string) {
  const [courses, teachers, categories] = await Promise.all([
    prisma.course.findMany({
      where: teacherId ? { teacherId } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        teacher: { select: { name: true } },
        category: { select: { name: true } },
        _count: { select: { modules: true, enrollments: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: { in: ["DOCENTE", "ADMIN"] }, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return {
    teachers,
    categories,
    courses: courses.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      level: c.level,
      status: c.status,
      durationHrs: c.durationHrs,
      categoryId: c.categoryId,
      teacherId: c.teacherId,
      teacherName: c.teacher.name,
      categoryName: c.category?.name ?? null,
      startDate: c.startDate?.toISOString() ?? null,
      endDate: c.endDate?.toISOString() ?? null,
      moduleCount: c._count.modules,
      studentCount: c._count.enrollments,
    })),
  };
}
