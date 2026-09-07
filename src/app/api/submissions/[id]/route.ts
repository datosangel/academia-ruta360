import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canManageCourse } from "@/lib/course-access";
import { notify } from "@/lib/notifications";

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("aprobar"),
    score: z.coerce.number().min(0),
    feedback: z.string().max(4000).optional().or(z.literal("")),
  }),
  z.object({
    action: z.literal("corregir"),
    feedback: z.string().min(3, "Explica qué debe corregir el alumno"),
  }),
]);

/**
 * El docente resuelve una entrega: la aprueba con nota, o pide corrección
 * (sin nota) y el alumno vuelve a poder reenviarla.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      assignment: {
        select: {
          title: true,
          maxScore: true,
          module: {
            select: {
              courseId: true,
              course: { select: { title: true, teacherId: true } },
            },
          },
        },
      },
    },
  });
  if (!submission) {
    return NextResponse.json({ error: "Entrega no encontrada" }, { status: 404 });
  }

  const session = await canManageCourse(submission.assignment.module.courseId);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const courseId = submission.assignment.module.courseId;

  if (parsed.data.action === "aprobar") {
    const score = Math.min(parsed.data.score, submission.assignment.maxScore);

    await prisma.submission.update({
      where: { id },
      data: {
        score,
        feedback: parsed.data.feedback || null,
        status: "APROBADO",
        gradedById: session.user.id,
        gradedAt: new Date(),
      },
    });

    await notify({
      userId: submission.studentId,
      type: "CALIFICACION",
      title: "Tarea aprobada",
      body: `"${submission.assignment.title}" (${submission.assignment.module.course.title}): ${score} / ${submission.assignment.maxScore}`,
      link: `/alumno/cursos/${courseId}?tarea=${submission.assignmentId}`,
    });
  } else {
    await prisma.submission.update({
      where: { id },
      data: {
        score: null,
        feedback: parsed.data.feedback,
        status: "REQUIERE_CORRECCION",
        gradedById: session.user.id,
        gradedAt: new Date(),
      },
    });

    await notify({
      userId: submission.studentId,
      type: "TAREA",
      title: "Tu entrega requiere corrección",
      body: `"${submission.assignment.title}" (${submission.assignment.module.course.title}): revisa el comentario del docente y vuelve a enviarla.`,
      link: `/alumno/cursos/${courseId}?tarea=${submission.assignmentId}`,
    });
  }

  return NextResponse.json({ ok: true });
}
