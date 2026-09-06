import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canManageQuiz } from "@/lib/quiz";

const optionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1, "Las alternativas no pueden estar vacías"),
  correct: z.boolean(),
});

const schema = z.object({
  quizId: z.string().min(1),
  text: z.string().min(5, "El enunciado es muy corto"),
  type: z.enum(["ALTERNATIVAS", "VERDADERO_FALSO", "ABIERTA"]),
  points: z.coerce.number().int().min(1).max(100).default(1),
  options: z.array(optionSchema).default([]),
});

/** Añade una pregunta al final del banco de la evaluación. */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const { quizId, text, type, points, options } = parsed.data;

  if (!(await canManageQuiz(quizId))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Una pregunta cerrada sin respuesta correcta sería imposible de calificar.
  if (type !== "ABIERTA") {
    if (options.length < 2) {
      return NextResponse.json(
        { error: "La pregunta necesita al menos dos alternativas" },
        { status: 400 }
      );
    }
    if (options.filter((o) => o.correct).length !== 1) {
      return NextResponse.json(
        { error: "Marca exactamente una alternativa como correcta" },
        { status: 400 }
      );
    }
  }

  const last = await prisma.question.findFirst({
    where: { quizId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  await prisma.question.create({
    data: {
      quizId,
      text,
      type,
      points,
      order: (last?.order ?? 0) + 1,
      options: type === "ABIERTA" ? null : JSON.stringify(options),
    },
  });

  return NextResponse.json({ ok: true });
}
