import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canManageCourse } from "@/lib/course-access";
import { urlOrUploadPath } from "@/lib/validation";

const schema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(5).optional(),
  attachmentUrl: urlOrUploadPath,
  dueDate: z.string().optional().or(z.literal("")),
  maxScore: z.coerce.number().positive().optional(),
});

async function canManageAssignment(assignmentId: string) {
  const a = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { module: { select: { courseId: true } } },
  });
  if (!a) return null;
  return canManageCourse(a.module.courseId);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!(await canManageAssignment(id))) {
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
  await prisma.assignment.update({
    where: { id },
    data: {
      ...(d.title !== undefined ? { title: d.title } : {}),
      ...(d.description !== undefined ? { description: d.description } : {}),
      ...(d.attachmentUrl !== undefined
        ? { attachmentUrl: d.attachmentUrl || null }
        : {}),
      ...(d.dueDate !== undefined
        ? { dueDate: d.dueDate ? new Date(d.dueDate) : null }
        : {}),
      ...(d.maxScore !== undefined ? { maxScore: d.maxScore } : {}),
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!(await canManageAssignment(id))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await prisma.assignment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
