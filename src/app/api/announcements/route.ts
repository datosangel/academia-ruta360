import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageCourse } from "@/lib/course-access";
import { notifyCourseStudents } from "@/lib/notifications";

const schema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(3, "El título es muy corto"),
  body: z.string().min(3, "El mensaje está vacío"),
});

/** Publica un anuncio en el curso y notifica a todos los matriculados. */
export async function POST(req: Request) {
  const session = await auth();
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const { courseId, title, body } = parsed.data;

  if (!(await canManageCourse(courseId))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { title: true },
  });

  await prisma.announcement.create({
    data: { courseId, title, body, authorId: session!.user.id },
  });

  await notifyCourseStudents(courseId, {
    type: "ANUNCIO",
    title: `Aviso: ${title}`,
    body: `${course?.title ?? ""}: ${body.slice(0, 100)}`,
    link: `/alumno/cursos/${courseId}`,
  });

  return NextResponse.json({ ok: true });
}
