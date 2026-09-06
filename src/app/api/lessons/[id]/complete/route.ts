import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recalcCourseProgress } from "@/lib/progress";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ALUMNO") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id: lessonId } = await params;
  const studentId = session.user.id;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { module: { select: { courseId: true } } },
  });
  if (!lesson) {
    return NextResponse.json({ error: "Lección no encontrada" }, { status: 404 });
  }

  const courseId = lesson.module.courseId;

  const enrollment = await prisma.enrollment.findUnique({
    where: { courseId_studentId: { courseId, studentId } },
  });
  if (!enrollment) {
    return NextResponse.json({ error: "No estás inscrito en este curso" }, { status: 403 });
  }

  const existing = await prisma.lessonProgress.findUnique({
    where: { lessonId_studentId: { lessonId, studentId } },
  });
  const nextCompleted = !existing?.completed;

  await prisma.lessonProgress.upsert({
    where: { lessonId_studentId: { lessonId, studentId } },
    update: { completed: nextCompleted, completedAt: nextCompleted ? new Date() : null },
    create: {
      lessonId,
      studentId,
      completed: nextCompleted,
      completedAt: nextCompleted ? new Date() : null,
    },
  });

  const progressPct = await recalcCourseProgress(courseId, studentId);

  return NextResponse.json({ completed: nextCompleted, progressPct });
}
