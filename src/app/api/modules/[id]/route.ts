import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canManageModule } from "@/lib/course-access";

const schema = z.object({ title: z.string().min(2) });

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!(await canManageModule(id))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  await prisma.module.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!(await canManageModule(id))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Las lecciones del módulo se borran en cascada (definido en el esquema).
  await prisma.module.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
