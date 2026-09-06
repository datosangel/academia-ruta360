"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Announcement = {
  id: string;
  title: string;
  body: string;
  authorName: string;
  createdAt: string;
};

const dateFmt = new Intl.DateTimeFormat("es", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function AnnouncementPanel({
  courseId,
  announcements,
  canPost,
}: {
  courseId: string;
  announcements: Announcement[];
  /** Solo el docente dueño o un admin pueden publicar. */
  canPost: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [posting, setPosting] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  const publicar = async (e: React.FormEvent) => {
    e.preventDefault();
    setPosting(true);
    setError(null);

    let res: Response;
    try {
      res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, title, body }),
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

    setTitle("");
    setBody("");
    startTransition(() => router.refresh());
  };

  const eliminar = async (id: string) => {
    if (!confirm("¿Eliminar este anuncio?")) return;
    await fetch(`/api/announcements/${id}`, { method: "DELETE" });
    startTransition(() => router.refresh());
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <p className="border-b border-slate-100 px-5 py-3 font-medium">
        Anuncios del curso
      </p>

      {canPost && (
        <form
          onSubmit={publicar}
          className="space-y-2 border-b border-slate-100 bg-slate-50/60 p-4"
        >
          <input
            required
            placeholder="Título del anuncio"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <textarea
            required
            rows={2}
            placeholder="Mensaje para tus alumnos"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={posting}
            className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {posting ? "Publicando..." : "Publicar aviso"}
          </button>
        </form>
      )}

      <ul className="divide-y divide-slate-100">
        {announcements.map((a) => (
          <li key={a.id} className="px-5 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{a.title}</p>
                <p className="mt-0.5 whitespace-pre-line text-sm text-slate-600">
                  {a.body}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {a.authorName} · {dateFmt.format(new Date(a.createdAt))}
                </p>
              </div>
              {canPost && (
                <button
                  onClick={() => eliminar(a.id)}
                  className="shrink-0 text-xs text-red-600 hover:underline"
                >
                  Eliminar
                </button>
              )}
            </div>
          </li>
        ))}
        {announcements.length === 0 && (
          <li className="px-5 py-6 text-center text-sm text-slate-500">
            Sin anuncios todavía.
          </li>
        )}
      </ul>
    </div>
  );
}
