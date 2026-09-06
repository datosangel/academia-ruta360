import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Foto de perfil: se guarda como data URL, con tope de tamaño (~700 KB). */
const AVATAR_MAX_CHARS = 700_000;

const profileSchema = z.object({
  name: z.string().min(2, "El nombre es muy corto"),
  phone: z.string().max(30).optional().or(z.literal("")),
  documentId: z.string().max(30).optional().or(z.literal("")),
  bio: z.string().max(500, "La descripción es muy larga").optional().or(z.literal("")),
  avatarUrl: z
    .string()
    .max(AVATAR_MAX_CHARS, "La imagen es demasiado pesada")
    .refine(
      (v) => v === "" || v.startsWith("data:image/"),
      "El formato de imagen no es válido"
    )
    .optional()
    .or(z.literal("")),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Ingresa tu contraseña actual"),
  newPassword: z
    .string()
    .min(8, "La nueva contraseña debe tener al menos 8 caracteres"),
});

/** Actualiza los datos personales y la foto del usuario autenticado. */
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const parsed = profileSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const { name, phone, documentId, bio, avatarUrl } = parsed.data;

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      phone: phone || null,
      documentId: documentId || null,
      bio: bio || null,
      ...(avatarUrl !== undefined ? { avatarUrl: avatarUrl || null } : {}),
    },
  });

  return NextResponse.json({ ok: true });
}

/** Cambia la contraseña, verificando primero la actual. */
export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const parsed = passwordSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const { currentPassword, newPassword } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json(
      { error: "La contraseña actual no es correcta" },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash: await bcrypt.hash(newPassword, 10) },
  });

  return NextResponse.json({ ok: true });
}
