import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guards";

const schema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  categoryId: z.string().optional().or(z.literal("")),
  durationHrs: z.coerce.number().int().positive().nullable().optional(),
  level: z.enum(["BASICO", "INTERMEDIO", "AVANZADO"]).optional(),
  status: z.enum(["BORRADOR", "PUBLICADO", "FINALIZADO", "ARCHIVADO"]).optional(),
  teacherId: z.string().optional(),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
});

/** Comprueba que quien edita sea admin, o el docente dueño del curso. */
async function canManage(courseId: string) {
  const session = await requireRole("ADMIN", "DOCENTE");
  if (!session) return null;
  if (session.user.role === "ADMIN") return session;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { teacherId: true },
  });
  if (!course || course.teacherId !== session.user.id) return null;
  return session;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await canManage(id);
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

  const d = parsed.data;

  // Reasignar el docente es potestad del administrador.
  if (d.teacherId && session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Solo un administrador puede reasignar el docente" },
      { status: 403 }
    );
  }

  await prisma.course.update({
    where: { id },
    data: {
      ...(d.title !== undefined ? { title: d.title } : {}),
      ...(d.description !== undefined ? { description: d.description } : {}),
      ...(d.imageUrl !== undefined ? { imageUrl: d.imageUrl || null } : {}),
      ...(d.categoryId !== undefined ? { categoryId: d.categoryId || null } : {}),
      ...(d.durationHrs !== undefined ? { durationHrs: d.durationHrs } : {}),
      ...(d.level !== undefined ? { level: d.level } : {}),
      ...(d.status !== undefined ? { status: d.status } : {}),
      ...(d.teacherId !== undefined ? { teacherId: d.teacherId } : {}),
      ...(d.startDate !== undefined
        ? { startDate: d.startDate ? new Date(d.startDate) : null }
        : {}),
      ...(d.endDate !== undefined
        ? { endDate: d.endDate ? new Date(d.endDate) : null }
        : {}),
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await canManage(id);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const enrolled = await prisma.enrollment.count({ where: { courseId: id } });
  if (enrolled > 0) {
    return NextResponse.json(
      {
        error: `El curso tiene ${enrolled} alumno(s) matriculados. Archívalo en lugar de eliminarlo.`,
      },
      { status: 409 }
    );
  }

  await prisma.course.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
