import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";

const schema = z.object({
  assignmentId: z.string().min(1),
  fileUrl: z.string().url("Pega un enlace válido (Drive, etc.)").optional().or(z.literal("")),
  comment: z.string().max(4000).optional().or(z.literal("")),
  // true = "Enviar" (queda a la espera del docente); false = "Guardar borrador".
  submit: z.boolean().default(true),
});

/** El alumno guarda un borrador, entrega o reemplaza su tarea. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ALUMNO") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const { assignmentId, fileUrl, comment, submit } = parsed.data;
  if (!fileUrl && !comment) {
    return NextResponse.json(
      { error: "Adjunta un enlace o escribe un comentario" },
      { status: 400 }
    );
  }

  const studentId = session.user.id;

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: {
      title: true,
      module: {
        select: {
          courseId: true,
          course: { select: { title: true, teacherId: true } },
        },
      },
    },
  });
  if (!assignment) {
    return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      courseId_studentId: {
        courseId: assignment.module.courseId,
        studentId,
      },
    },
  });
  if (!enrollment) {
    return NextResponse.json(
      { error: "No estás matriculado en este curso" },
      { status: 403 }
    );
  }

  const data = {
    fileUrl: fileUrl || null,
    comment: comment || null,
    status: submit ? ("ENTREGADO" as const) : ("BORRADOR" as const),
    submittedAt: submit ? new Date() : null,
    // Una nueva entrega reabre la revisión: se limpia la calificación previa.
    score: null,
    feedback: null,
    gradedById: null,
    gradedAt: null,
  };

  const submission = await prisma.submission.upsert({
    where: { assignmentId_studentId: { assignmentId, studentId } },
    update: data,
    create: { assignmentId, studentId, ...data },
  });

  if (submit) {
    await notify({
      userId: assignment.module.course.teacherId,
      type: "TAREA",
      title: "Nueva entrega para revisar",
      body: `${session.user.name} entregó "${assignment.title}" (${assignment.module.course.title})`,
      link: `/docente/tareas/${assignmentId}`,
    });
  }

  return NextResponse.json({ ok: true, id: submission.id, status: submission.status });
}
