import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guards";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(["ADMIN", "DOCENTE", "ALUMNO"]).optional(),
  active: z.boolean().optional(),
  password: z.string().min(8).optional(),
});

/** Edita datos, rol o estado de un usuario. Solo administradores. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireRole("ADMIN");
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const { password, email, ...rest } = parsed.data;

  // Un administrador no puede quitarse a sí mismo el rol ni desactivarse,
  // para no dejar la plataforma sin acceso administrativo.
  if (id === session.user.id && (rest.role !== undefined || rest.active === false)) {
    return NextResponse.json(
      { error: "No puedes cambiar tu propio rol ni desactivarte" },
      { status: 400 }
    );
  }

  if (email) {
    const clash = await prisma.user.findFirst({
      where: { email, NOT: { id } },
      select: { id: true },
    });
    if (clash) {
      return NextResponse.json(
        { error: "Ese correo ya está en uso" },
        { status: 409 }
      );
    }
  }

  await prisma.user.update({
    where: { id },
    data: {
      ...rest,
      ...(email ? { email } : {}),
      ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
    },
  });

  return NextResponse.json({ ok: true });
}

/** Elimina un usuario. Solo administradores. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireRole("ADMIN");
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  if (id === session.user.id) {
    return NextResponse.json(
      { error: "No puedes eliminar tu propia cuenta" },
      { status: 400 }
    );
  }

  // Un docente con cursos a cargo no se puede borrar sin dejarlos huérfanos.
  const coursesTaught = await prisma.course.count({ where: { teacherId: id } });
  if (coursesTaught > 0) {
    return NextResponse.json(
      {
        error: `Tiene ${coursesTaught} curso(s) asignados. Reasígnalos antes de eliminar.`,
      },
      { status: 409 }
    );
  }

  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
