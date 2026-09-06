"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

type Person = {
  id: string;
  name: string;
  role: string;
  avatarUrl: string | null;
};

type Conversation = {
  person: Person;
  lastMessage: string;
  lastAt: string;
  unread: number;
};

type ChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  mine: boolean;
};

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  DOCENTE: "Docente",
  ALUMNO: "Estudiante",
};

const timeFmt = new Intl.DateTimeFormat("es", {
  hour: "2-digit",
  minute: "2-digit",
});
const dayFmt = new Intl.DateTimeFormat("es", { day: "2-digit", month: "short" });

function Avatar({ person, size = 40 }: { person: Person; size?: number }) {
  const initials = person.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  if (person.avatarUrl) {
    return (
      <Image
        src={person.avatarUrl}
        alt=""
        width={size}
        height={size}
        unoptimized
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-700 font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.34 }}
    >
      {initials}
    </span>
  );
}

export function ChatView({
  conversations,
  contacts,
  activePerson,
  messages,
}: {
  conversations: Conversation[];
  contacts: Person[];
  activePerson: Person | null;
  messages: ChatMessage[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showContacts, setShowContacts] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, activePerson?.id]);

  const openConversation = (personId: string) => {
    setShowContacts(false);
    router.push(`/chat?con=${personId}`);
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePerson || !text.trim()) return;

    setSending(true);
    setError(null);

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientId: activePerson.id, body: text.trim() }),
    });

    setSending(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo enviar el mensaje");
      return;
    }

    setText("");
    startTransition(() => router.refresh());
  };

  return (
    <div className="grid h-[calc(100vh-9rem)] grid-cols-1 gap-4 md:grid-cols-[320px_1fr]">
      {/* ---------- Lista de conversaciones ---------- */}
      <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h1 className="text-lg font-bold">Chat</h1>
          <button
            onClick={() => setShowContacts((v) => !v)}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            {showContacts ? "Cancelar" : "+ Crear"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {showContacts ? (
            <ul className="divide-y divide-slate-100">
              <li className="px-5 py-2 text-xs uppercase tracking-wide text-slate-400">
                Personas de tus cursos
              </li>
              {contacts.map((person) => (
                <li key={person.id}>
                  <button
                    onClick={() => openConversation(person.id)}
                    className="flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-slate-50"
                  >
                    <Avatar person={person} size={36} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {person.name}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {ROLE_LABEL[person.role]}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
              {contacts.length === 0 && (
                <li className="px-5 py-4 text-sm text-slate-500">
                  Aún no compartes curso con nadie.
                </li>
              )}
            </ul>
          ) : (
            <ul className="divide-y divide-slate-100">
              {conversations.map((c) => (
                <li key={c.person.id}>
                  <button
                    onClick={() => openConversation(c.person.id)}
                    className={`flex w-full items-start gap-3 px-5 py-3 text-left transition hover:bg-slate-50 ${
                      activePerson?.id === c.person.id
                        ? "border-l-2 border-indigo-600 bg-indigo-50/60"
                        : "border-l-2 border-transparent"
                    }`}
                  >
                    <Avatar person={c.person} size={40} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-medium">
                          {c.person.name}
                        </span>
                        <span className="shrink-0 text-[11px] text-slate-400">
                          {dayFmt.format(new Date(c.lastAt))}
                        </span>
                      </span>
                      <span className="mt-0.5 flex items-center gap-2">
                        <span className="truncate text-xs text-slate-500">
                          {c.lastMessage}
                        </span>
                        {c.unread > 0 && (
                          <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-semibold text-white">
                            {c.unread}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
              {conversations.length === 0 && (
                <li className="px-5 py-8 text-center text-sm text-slate-500">
                  Todavía no tienes conversaciones.
                  <br />
                  Pulsa <strong>+ Crear</strong> para empezar una.
                </li>
              )}
            </ul>
          )}
        </div>
      </div>

      {/* ---------- Conversación activa ---------- */}
      <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {activePerson ? (
          <>
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
              <Avatar person={activePerson} size={44} />
              <div>
                <p className="font-semibold">{activePerson.name}</p>
                <p className="text-xs text-slate-500">
                  {ROLE_LABEL[activePerson.role]}
                </p>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.mine ? "justify-end" : "justify-start"}`}
                >
                  <div className="max-w-[75%]">
                    <p
                      className={`whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm ${
                        m.mine
                          ? "bg-indigo-50 text-slate-800"
                          : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {m.body}
                    </p>
                    <p
                      className={`mt-1 text-[11px] text-slate-400 ${
                        m.mine ? "text-right" : ""
                      }`}
                    >
                      {timeFmt.format(new Date(m.createdAt))}
                    </p>
                  </div>
                </div>
              ))}
              {messages.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-500">
                  Escribe el primer mensaje.
                </p>
              )}
              <div ref={endRef} />
            </div>

            {error && (
              <p className="px-5 pb-2 text-sm text-red-600">{error}</p>
            )}

            <form
              onSubmit={send}
              className="flex items-center gap-3 border-t border-slate-100 px-5 py-4"
            >
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Escribir mensaje"
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={sending || !text.trim()}
                aria-label="Enviar mensaje"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white transition hover:bg-indigo-500 disabled:opacity-50"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />
                </svg>
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <p className="text-4xl">💬</p>
            <p className="mt-3 font-medium">Selecciona una conversación</p>
            <p className="mt-1 text-sm text-slate-600">
              O pulsa «+ Crear» para escribirle a un docente o compañero.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
