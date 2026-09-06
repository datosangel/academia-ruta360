import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canManageCourse } from "@/lib/course-access";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const announcement = await prisma.announcement.findUnique({
    where: { id },
    select: { courseId: true },
  });
  if (!announcement) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  if (!(await canManageCourse(announcement.courseId))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await prisma.announcement.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
