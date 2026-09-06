import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guards";

/**
 * Permite gestionar el contenido de un curso a los administradores y al
 * docente propietario. Devuelve la sesión, o null si no tiene permiso.
 */
export async function canManageCourse(courseId: string) {
  const session = await requireRole("ADMIN", "DOCENTE");
  if (!session) return null;
  if (session.user.role === "ADMIN") return session;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { teacherId: true },
  });
  if (!course || course.teacherId !== session.user.id) return null;
  return session;
}

/** Igual que canManageCourse, pero partiendo de un módulo. */
export async function canManageModule(moduleId: string) {
  const mod = await prisma.module.findUnique({
    where: { id: moduleId },
    select: { courseId: true },
  });
  if (!mod) return null;
  return canManageCourse(mod.courseId);
}

/** Igual que canManageCourse, pero partiendo de una lección. */
export async function canManageLesson(lessonId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { module: { select: { courseId: true } } },
  });
  if (!lesson) return null;
  return canManageCourse(lesson.module.courseId);
}
