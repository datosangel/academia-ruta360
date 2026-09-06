import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canManageModule } from "@/lib/course-access";

const schema = z.object({
  moduleId: z.string().min(1),
  title: z.string().min(3, "El título es muy corto"),
  timeLimitMin: z.coerce.number().int().positive().nullable().optional(),
  maxAttempts: z.coerce.number().int().min(1).max(20).default(1),
  showResults: z.boolean().default(true),
});

/** Crea una evaluación dentro de un módulo. */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const { moduleId, title, timeLimitMin, maxAttempts, showResults } = parsed.data;

  if (!(await canManageModule(moduleId))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const quiz = await prisma.quiz.create({
    data: {
      moduleId,
      title,
      timeLimitMin: timeLimitMin ?? null,
      maxAttempts,
      showResults,
    },
  });

  return NextResponse.json({ ok: true, id: quiz.id });
}
