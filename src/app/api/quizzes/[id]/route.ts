import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canManageQuiz } from "@/lib/quiz";

const schema = z.object({
  title: z.string().min(3).optional(),
  timeLimitMin: z.coerce.number().int().positive().nullable().optional(),
  maxAttempts: z.coerce.number().int().min(1).max(20).optional(),
  showResults: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!(await canManageQuiz(id))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  await prisma.quiz.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!(await canManageQuiz(id))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Preguntas e intentos se borran en cascada (definido en el esquema).
  await prisma.quiz.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
