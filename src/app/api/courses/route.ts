import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guards";

const schema = z.object({
  title: z.string().min(3, "El nombre es muy corto"),
  description: z.string().min(10, "La descripción es muy corta"),
  imageUrl: z.string().url().optional().or(z.literal("")),
  categoryId: z.string().optional().or(z.literal("")),
  durationHrs: z.coerce.number().int().positive().optional(),
  level: z.enum(["BASICO", "INTERMEDIO", "AVANZADO"]),
  status: z.enum(["BORRADOR", "PUBLICADO", "FINALIZADO", "ARCHIVADO"]),
  teacherId: z.string().min(1, "Debes asignar un docente"),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
});

/** Crea un curso. Administradores, o docentes para sí mismos. */
export async function POST(req: Request) {
  const session = await requireRole("ADMIN", "DOCENTE");
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

  const data = parsed.data;

  // Un docente solo puede crear cursos a su propio nombre.
  if (session.user.role === "DOCENTE" && data.teacherId !== session.user.id) {
    return NextResponse.json(
      { error: "Solo puedes crear cursos a tu nombre" },
      { status: 403 }
    );
  }

  const teacher = await prisma.user.findUnique({
    where: { id: data.teacherId },
    select: { role: true },
  });
  if (!teacher || (teacher.role !== "DOCENTE" && teacher.role !== "ADMIN")) {
    return NextResponse.json(
      { error: "El docente asignado no es válido" },
      { status: 400 }
    );
  }

  const course = await prisma.course.create({
    data: {
      title: data.title,
      description: data.description,
      imageUrl: data.imageUrl || null,
      categoryId: data.categoryId || null,
      durationHrs: data.durationHrs ?? null,
      level: data.level,
      status: data.status,
      teacherId: data.teacherId,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
    },
  });

  return NextResponse.json({ ok: true, id: course.id });
}
