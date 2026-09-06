import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canMessage } from "@/lib/chat";
import { notify } from "@/lib/notifications";

const schema = z.object({
  recipientId: z.string().min(1),
  body: z.string().min(1, "El mensaje está vacío").max(4000),
});

/** Envía un mensaje a un usuario con el que se comparte curso. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const { recipientId, body } = parsed.data;

  if (recipientId === session.user.id) {
    return NextResponse.json(
      { error: "No puedes enviarte mensajes a ti mismo" },
      { status: 400 }
    );
  }

  if (!(await canMessage(session.user.id, recipientId))) {
    return NextResponse.json(
      { error: "Solo puedes escribir a personas de tus cursos" },
      { status: 403 }
    );
  }

  await prisma.message.create({
    data: { senderId: session.user.id, recipientId, body },
  });

  await notify({
    userId: recipientId,
    type: "MENSAJE",
    title: session.user.name ?? "Nuevo mensaje",
    body: body.slice(0, 120),
    link: `/chat?con=${session.user.id}`,
  });

  return NextResponse.json({ ok: true });
}
