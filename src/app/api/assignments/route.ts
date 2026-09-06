import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canManageModule } from "@/lib/course-access";
import { notifyCourseStudents } from "@/lib/notifications";
import { formatDueDate } from "@/lib/format";
import { urlOrUploadPath } from "@/lib/validation";

const schema = z.object({
  moduleId: z.string().min(1),
  title: z.string().min(3, "El título es muy corto"),
  description: z.string().min(5, "Agrega una descripción o instrucciones"),
  attachmentUrl: urlOrUploadPath,
  dueDate: z.string().optional().or(z.literal("")),
  maxScore: z.coerce.number().positive().default(20),
});

/** Crea una tarea en un módulo y avisa a todos los alumnos matriculados. */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const { moduleId, title, description, attachmentUrl, dueDate, maxScore } =
    parsed.data;

  if (!(await canManageModule(moduleId))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const mod = await prisma.module.findUnique({
    where: { id: moduleId },
    select: { courseId: true, course: { select: { title: true } } },
  });
  if (!mod) {
    return NextResponse.json({ error: "Módulo no encontrado" }, { status: 404 });
  }

  const assignment = await prisma.assignment.create({
    data: {
      moduleId,
      title,
      description,
      attachmentUrl: attachmentUrl || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      maxScore,
    },
  });

  await notifyCourseStudents(mod.courseId, {
    type: "TAREA",
    title: "Nueva tarea",
    body: `${mod.course.title}: "${title}"${dueDate ? ` · entrega hasta ${formatDueDate(dueDate)}` : ""}`,
    link: `/alumno/cursos/${mod.courseId}?tarea=${assignment.id}`,
  });

  return NextResponse.json({ ok: true, id: assignment.id });
}
