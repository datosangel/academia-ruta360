import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canManageQuestion } from "@/lib/quiz";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!(await canManageQuestion(id))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await prisma.question.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
