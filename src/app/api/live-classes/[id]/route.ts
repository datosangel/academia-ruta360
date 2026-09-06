import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canManageCourse } from "@/lib/course-access";
import { urlOrUploadPath } from "@/lib/validation";

const schema = z.object({
  recordingUrl: urlOrUploadPath,
  materialUrl: urlOrUploadPath,
});

async function canManageClass(id: string) {
  const c = await prisma.liveClass.findUnique({
    where: { id },
    select: { courseId: true },
  });
  if (!c) return null;
  return canManageCourse(c.courseId);
}

/** Añade la grabación o el material posterior de una clase ya realizada. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!(await canManageClass(id))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  await prisma.liveClass.update({
    where: { id },
    data: {
      ...(parsed.data.recordingUrl !== undefined
        ? { recordingUrl: parsed.data.recordingUrl || null }
        : {}),
      ...(parsed.data.materialUrl !== undefined
        ? { materialUrl: parsed.data.materialUrl || null }
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
  if (!(await canManageClass(id))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await prisma.liveClass.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
