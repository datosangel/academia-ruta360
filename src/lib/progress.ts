import { prisma } from "@/lib/prisma";
import { checkAndIssueCertificate } from "@/lib/certificates";

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

  // Al terminar el curso se revisa si ya cumple todo lo demás
  // (evaluaciones y trabajos aprobados) para emitir el certificado solo.
  if (progressPct === 100) {
    await checkAndIssueCertificate(courseId, studentId);
  }

  return progressPct;
}
