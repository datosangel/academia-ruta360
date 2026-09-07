import { prisma } from "@/lib/prisma";

export async function recalcCourseProgress(courseId: string, studentId: string) {
  const totalLessons = await prisma.lesson.count({
    where: { module: { courseId } },
  });

  const completedLessons = await prisma.lessonProgress.count({
    where: {
      completed: true,
      studentId,
      lesson: { module: { courseId } },
    },
  });

  const progressPct =
    totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

  await prisma.enrollment.update({
    where: { courseId_studentId: { courseId, studentId } },
    data: {
      progressPct,
      completedAt: progressPct === 100 ? new Date() : null,
    },
  });

  return progressPct;
}
