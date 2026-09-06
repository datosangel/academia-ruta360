import { prisma } from "@/lib/prisma";

/**
 * Contactos con los que un usuario comparte curso: para un alumno son sus
 * docentes y compañeros; para un docente, sus alumnos. El administrador puede
 * escribir a cualquiera.
 */
export async function listContacts(userId: string, role: string) {
  if (role === "ADMIN") {
    return prisma.user.findMany({
      where: { id: { not: userId }, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, role: true, avatarUrl: true },
    });
  }

  if (role === "DOCENTE") {
    return prisma.user.findMany({
      where: {
        id: { not: userId },
        active: true,
        enrollments: { some: { course: { teacherId: userId } } },
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true, role: true, avatarUrl: true },
    });
  }

  // Alumno: docentes de sus cursos y compañeros de clase.
  return prisma.user.findMany({
    where: {
      id: { not: userId },
      active: true,
      OR: [
        { coursesTaught: { some: { enrollments: { some: { studentId: userId } } } } },
        {
          enrollments: {
            some: { course: { enrollments: { some: { studentId: userId } } } },
          },
        },
      ],
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true, role: true, avatarUrl: true },
  });
}

/** ¿Puede `senderId` escribirle a `recipientId`? */
export async function canMessage(senderId: string, recipientId: string) {
  const sender = await prisma.user.findUnique({
    where: { id: senderId },
    select: { role: true },
  });
  if (!sender) return false;

  const contacts = await listContacts(senderId, sender.role);
  return contacts.some((c) => c.id === recipientId);
}

/**
 * Conversaciones del usuario: la última línea con cada persona con la que ha
 * intercambiado mensajes, ordenadas por lo más reciente.
 */
export async function listConversations(userId: string) {
  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: userId }, { recipientId: userId }] },
    orderBy: { createdAt: "desc" },
    include: {
      sender: { select: { id: true, name: true, role: true, avatarUrl: true } },
      recipient: { select: { id: true, name: true, role: true, avatarUrl: true } },
    },
  });

  const byPerson = new Map<
    string,
    {
      person: { id: string; name: string; role: string; avatarUrl: string | null };
      lastMessage: string;
      lastAt: Date;
      unread: number;
    }
  >();

  for (const m of messages) {
    const person = m.senderId === userId ? m.recipient : m.sender;
    const entry = byPerson.get(person.id);

    if (!entry) {
      byPerson.set(person.id, {
        person,
        lastMessage: m.body,
        lastAt: m.createdAt,
        unread: m.recipientId === userId && !m.readAt ? 1 : 0,
      });
    } else if (m.recipientId === userId && !m.readAt) {
      entry.unread += 1;
    }
  }

  return [...byPerson.values()];
}
