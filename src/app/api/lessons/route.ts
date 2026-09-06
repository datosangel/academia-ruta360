import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canManageModule } from "@/lib/course-access";
import { urlOrUploadPath } from "@/lib/validation";

const schema = z.object({
  moduleId: z.string().min(1),
  title: z.string().min(2, "El título es muy corto"),
  type: z.enum([
    "VIDEO",
    "PDF",
    "PRESENTACION",
    "ARCHIVO",
    "LINK_EXTERNO",
    "ACTIVIDAD",
  ]),
  contentUrl: urlOrUploadPath,
  body: z.string().optional().or(z.literal("")),
});

/** Añade una lección al final del módulo. */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const { moduleId, title, type, contentUrl, body } = parsed.data;
  if (!(await canManageModule(moduleId))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const last = await prisma.lesson.findFirst({
    where: { moduleId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  await prisma.lesson.create({
    data: {
      moduleId,
      title,
      type,
      contentUrl: contentUrl || null,
      body: body || null,
      order: (last?.order ?? 0) + 1,
    },
  });

  return NextResponse.json({ ok: true });
}
