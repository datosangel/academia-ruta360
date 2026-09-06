import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canManageLesson } from "@/lib/course-access";
import { urlOrUploadPath } from "@/lib/validation";

const schema = z.object({
  title: z.string().min(2).optional(),
  type: z
    .enum(["VIDEO", "PDF", "PRESENTACION", "ARCHIVO", "LINK_EXTERNO", "ACTIVIDAD"])
    .optional(),
  contentUrl: urlOrUploadPath,
  body: z.string().optional().or(z.literal("")),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!(await canManageLesson(id))) {
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
  await prisma.lesson.update({
    where: { id },
    data: {
      ...(d.title !== undefined ? { title: d.title } : {}),
      ...(d.type !== undefined ? { type: d.type } : {}),
      ...(d.contentUrl !== undefined ? { contentUrl: d.contentUrl || null } : {}),
      ...(d.body !== undefined ? { body: d.body || null } : {}),
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!(await canManageLesson(id))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await prisma.lesson.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
