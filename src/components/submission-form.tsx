"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Status = "SIN_ENVIAR" | "BORRADOR" | "ENTREGADO" | "REQUIERE_CORRECCION" | "APROBADO";

const STATUS_CHIP: Record<Status, { label: string; className: string } | null> = {
  SIN_ENVIAR: null,
  BORRADOR: { label: "Borrador guardado", className: "bg-slate-100 text-slate-600" },
  ENTREGADO: { label: "En revisión del docente", className: "bg-violet-100 text-violet-700" },
  REQUIERE_CORRECCION: { label: "Requiere corrección", className: "bg-red-100 text-red-700" },
  APROBADO: { label: "Aprobada", className: "bg-green-100 text-green-700" },
};

export function SubmissionForm({
  assignmentId,
  initialFileUrl,
  initialComment,
  status,
}: {
  assignmentId: string;
  initialFileUrl: string;
  initialComment: string;
  status: Status;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [fileUrl, setFileUrl] = useState(initialFileUrl);
  const [comment, setComment] = useState(initialComment);
  const [saving, setSaving] = useState<"borrador" | "enviar" | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Ya enviada (y no en corrección) => bloqueada hasta que el alumno pida
  // reemplazarla explícitamente.
  const [editing, setEditing] = useState(status !== "ENTREGADO");

  const guardar = async (submit: boolean) => {
    setSaving(submit ? "enviar" : "borrador");
    setError(null);

    let res: Response;
    try {
      res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId, fileUrl, comment, submit }),
      });
    } catch {
      setSaving(null);
      setError("No se pudo conectar con el servidor. Intenta de nuevo.");
      return;
    }

    setSaving(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo guardar");
      return;
    }

    if (submit) setEditing(false);
    startTransition(() => router.refresh());
  };

  const chip = STATUS_CHIP[status];

  if (!editing) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-slate-800">Tu entrega</p>
          {chip && (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${chip.className}`}>
              {chip.label}
            </span>
          )}
        </div>
        {fileUrl && (
          <p className="mt-2 text-sm">
            Enlace:{" "}
            <a href={fileUrl} target="_blank" rel="noreferrer" className="text-indigo-600 underline">
              {fileUrl}
            </a>
          </p>
        )}
        {comment && (
          <p className="mt-2 whitespace-pre-line rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {comment}
          </p>
        )}
        <button
          onClick={() => setEditing(true)}
          className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Reemplazar entrega
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <p className="font-medium">
          {status === "SIN_ENVIAR" ? "Crear entrega" : "Reemplazar entrega"}
        </p>
        {chip && (
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${chip.className}`}>
            {chip.label}
          </span>
        )}
      </div>

      <label className="block text-xs font-medium text-slate-600">
        Enlace a tu archivo (Google Drive, OneDrive, etc.)
        <input
          type="url"
          placeholder="https://drive.google.com/..."
          value={fileUrl}
          onChange={(e) => setFileUrl(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
      </label>

      <label className="block text-xs font-medium text-slate-600">
        Comentario o respuesta escrita
        <textarea
          rows={4}
          placeholder="Puedes escribir tu respuesta aquí en vez de (o además de) adjuntar un enlace"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => guardar(true)}
          disabled={saving !== null}
          className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
        >
          {saving === "enviar" ? "Enviando..." : "Enviar"}
        </button>
        <button
          type="button"
          onClick={() => guardar(false)}
          disabled={saving !== null}
          className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {saving === "borrador" ? "Guardando..." : "Guardar borrador"}
        </button>
        {status !== "SIN_ENVIAR" && status !== "BORRADOR" && (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-lg px-5 py-2 text-sm text-slate-500"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
