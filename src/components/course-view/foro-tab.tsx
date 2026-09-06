"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Post = {
  id: string;
  body: string;
  authorName: string;
  authorId: string;
  createdAt: string;
  replies: {
    id: string;
    body: string;
    authorName: string;
    authorId: string;
    createdAt: string;
  }[];
};

const dateFmt = new Intl.DateTimeFormat("es", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function ReplyBox({
  courseId,
  parentId,
  onDone,
}: {
  courseId: string;
  parentId: string;
  onDone: () => void;
}) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await fetch("/api/forum-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, parentId, body }),
      });
    } catch {
      // Se ignora: el botón se libera igual abajo para no dejarlo bloqueado.
    }
    setSending(false);
    setBody("");
    onDone();
  };

  return (
    <form onSubmit={enviar} className="mt-2 flex gap-2">
      <input
        required
        placeholder="Responder..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
      />
      <button
        type="submit"
        disabled={sending}
        className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-60"
      >
        Responder
      </button>
    </form>
  );
}

export function ForoTab({
  courseId,
  posts,
  currentUserId,
}: {
  courseId: string;
  posts: Post[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [newBody, setNewBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => startTransition(() => router.refresh());

  const publicar = async (e: React.FormEvent) => {
    e.preventDefault();
    setPosting(true);
    setError(null);

    let res: Response;
    try {
      res = await fetch("/api/forum-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, body: newBody }),
      });
    } catch {
      setPosting(false);
      setError("No se pudo conectar con el servidor. Intenta de nuevo.");
      return;
    }

    setPosting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo publicar");
      return;
    }
    setNewBody("");
    refresh();
  };

  const eliminar = async (id: string) => {
    if (!confirm("¿Eliminar este mensaje?")) return;
    await fetch(`/api/forum-posts/${id}`, { method: "DELETE" });
    refresh();
  };

  return (
    <div className="space-y-4">
      <form
        onSubmit={publicar}
        className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <textarea
          required
          rows={2}
          placeholder="Escribe una consulta para el curso..."
          value={newBody}
          onChange={(e) => setNewBody(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={posting}
          className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {posting ? "Publicando..." : "Publicar"}
        </button>
      </form>

      <div className="space-y-3">
        {posts.map((p) => (
          <div
            key={p.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{p.authorName}</p>
                <p className="mt-0.5 whitespace-pre-line text-sm text-slate-700">
                  {p.body}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {dateFmt.format(new Date(p.createdAt))}
                </p>
              </div>
              {p.authorId === currentUserId && (
                <button
                  onClick={() => eliminar(p.id)}
                  className="shrink-0 text-xs text-red-600 hover:underline"
                >
                  Eliminar
                </button>
              )}
            </div>

            {p.replies.length > 0 && (
              <div className="mt-3 space-y-2 border-l-2 border-slate-100 pl-4">
                {p.replies.map((r) => (
                  <div key={r.id} className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-slate-700">{r.authorName}</p>
                      <p className="whitespace-pre-line text-sm text-slate-600">{r.body}</p>
                      <p className="text-[11px] text-slate-400">
                        {dateFmt.format(new Date(r.createdAt))}
                      </p>
                    </div>
                    {r.authorId === currentUserId && (
                      <button
                        onClick={() => eliminar(r.id)}
                        className="shrink-0 text-xs text-red-600 hover:underline"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {replyingTo === p.id ? (
              <ReplyBox courseId={courseId} parentId={p.id} onDone={() => { setReplyingTo(null); refresh(); }} />
            ) : (
              <button
                onClick={() => setReplyingTo(p.id)}
                className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-500"
              >
                Responder
              </button>
            )}
          </div>
        ))}
        {posts.length === 0 && (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
            Todavía no hay mensajes en el foro. Sé el primero en escribir.
          </p>
        )}
      </div>
    </div>
  );
}
