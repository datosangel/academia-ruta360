import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canManageCourse } from "@/lib/course-access";

const schema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(2, "El título es muy corto"),
});

/** Añade un módulo al final del curso. */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const { courseId, title } = parsed.data;
  if (!(await canManageCourse(courseId))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const last = await prisma.module.findFirst({
    where: { courseId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  await prisma.module.create({
    data: { courseId, title, order: (last?.order ?? 0) + 1 },
  });

  return NextResponse.json({ ok: true });
}
