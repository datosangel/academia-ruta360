import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listContacts, listConversations } from "@/lib/chat";
import { ChatView } from "@/components/chat-view";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ con?: string }>;
}) {
  const session = await auth();
  const userId = session!.user.id;
  const { con } = await searchParams;

  const [conversations, contacts] = await Promise.all([
    listConversations(userId),
    listContacts(userId, session!.user.role),
  ]);

  // La persona activa puede venir de una conversación existente o de contactos.
  const activePerson = con
    ? (conversations.find((c) => c.person.id === con)?.person ??
      contacts.find((c) => c.id === con) ??
      null)
    : null;

  let messages: {
    id: string;
    body: string;
    createdAt: string;
    mine: boolean;
  }[] = [];

  if (activePerson) {
    const rows = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, recipientId: activePerson.id },
          { senderId: activePerson.id, recipientId: userId },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    messages = rows.map((m) => ({
      id: m.id,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
      mine: m.senderId === userId,
    }));

    // Al abrir la conversación se marcan como leídos los mensajes recibidos.
    await prisma.message.updateMany({
      where: { senderId: activePerson.id, recipientId: userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  return (
    <ChatView
      conversations={conversations.map((c) => ({
        ...c,
        lastAt: c.lastAt.toISOString(),
      }))}
      contacts={contacts}
      activePerson={activePerson}
      messages={messages}
    />
  );
}
