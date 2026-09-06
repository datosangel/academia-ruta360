import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify, notifyCourseStudents } from "@/lib/notifications";

const schema = z.object({
  courseId: z.string().min(1),
  body: z.string().min(2, "Escribe un mensaje"),
  parentId: z.string().optional().or(z.literal("")),
});

/**
 * Publica un mensaje en el foro del curso. Alumnos matriculados y el
 * docente/admin dueño del curso pueden participar.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const { courseId, body, parentId } = parsed.data;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { title: true, teacherId: true },
  });
  if (!course) {
    return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });
  }

  const esDocenteDelCurso = course.teacherId === session.user.id;
  const esAdmin = session.user.role === "ADMIN";

  if (!esDocenteDelCurso && !esAdmin) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { courseId_studentId: { courseId, studentId: session.user.id } },
    });
    if (!enrollment) {
      return NextResponse.json(
        { error: "No estás matriculado en este curso" },
        { status: 403 }
      );
    }
  }

  const post = await prisma.forumPost.create({
    data: {
      courseId,
      authorId: session.user.id,
      body,
      parentId: parentId || null,
    },
  });

  // Una respuesta avisa solo al autor del hilo; una consulta nueva, al docente.
  if (parentId) {
    const original = await prisma.forumPost.findUnique({
      where: { id: parentId },
      select: { authorId: true },
    });
    if (original && original.authorId !== session.user.id) {
      await notify({
        userId: original.authorId,
        type: "ANUNCIO",
        title: "Nueva respuesta en el foro",
        body: `${session.user.name} respondió en "${course.title}"`,
        link: `/alumno/cursos/${courseId}?tab=foros`,
      });
    }
  } else if (!esDocenteDelCurso) {
    await notify({
      userId: course.teacherId,
      type: "ANUNCIO",
      title: "Nueva consulta en el foro",
      body: `${session.user.name} preguntó en "${course.title}"`,
      link: `/docente/cursos/${courseId}?tab=foros`,
    });
  } else {
    // El docente abrió un hilo: se avisa a todo el curso.
    await notifyCourseStudents(courseId, {
      type: "ANUNCIO",
      title: "Nuevo tema en el foro",
      body: `${course.title}: el docente abrió un tema en el foro`,
      link: `/alumno/cursos/${courseId}?tab=foros`,
    });
  }

  return NextResponse.json({ ok: true, id: post.id });
}
