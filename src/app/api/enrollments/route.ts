import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ courseId: z.string().min(1) });

/** Matricula al alumno autenticado en un curso publicado. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ALUMNO") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { courseId } = parsed.data;
  const studentId = session.user.id;

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || course.status !== "PUBLICADO") {
    return NextResponse.json(
      { error: "El curso no está disponible" },
      { status: 404 }
    );
  }

  const existing = await prisma.enrollment.findUnique({
    where: { courseId_studentId: { courseId, studentId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Ya estás matriculado" }, { status: 409 });
  }

  await prisma.enrollment.create({ data: { courseId, studentId } });

  return NextResponse.json({ ok: true });
}
