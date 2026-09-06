import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canManageCourse } from "@/lib/course-access";

/** Quita a un alumno de un curso (admin, o el docente dueño del curso). */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const enrollment = await prisma.enrollment.findUnique({ where: { id } });
  if (!enrollment) {
    return NextResponse.json({ error: "Matrícula no encontrada" }, { status: 404 });
  }

  if (!(await canManageCourse(enrollment.courseId))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await prisma.enrollment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
