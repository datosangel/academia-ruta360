"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

type LiveClass = {
  id: string;
  title: string;
  provider: string;
  scheduledAt: string;
  durationMin: number;
  joinUrl: string | null;
  recordingUrl: string | null;
};

const PROVIDER_LABEL: Record<string, string> = {
  ZOOM: "Zoom",
  GOOGLE_MEET: "Google Meet",
  MS_TEAMS: "Microsoft Teams",
  INTERNO: "Videollamada interna",
};

const dateFmt = new Intl.DateTimeFormat("es", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

/** Botón para subir la grabación ya exportada de una clase pasada (no se graba en vivo). */
function SubirGrabacion({ classId, onDone }: { classId: string; onDone: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    const fd = new FormData();
    fd.append("file", file);

    let uploadRes: Response;
    try {
      uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
    } catch {
      setUploading(false);
      setError("No se pudo conectar con el servidor.");
      return;
    }
    const uploadData = await uploadRes.json().catch(() => ({}));
    if (!uploadRes.ok) {
      setUploading(false);
      setError(uploadData.error ?? "No se pudo subir la grabación");
      return;
    }

    await fetch(`/api/live-classes/${classId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recordingUrl: uploadData.url }),
    });

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
    onDone();
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="rounded-lg border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50 disabled:opacity-60"
      >
        {uploading ? "Subiendo..." : "📹 Subir grabación"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        onChange={handleFile}
        className="hidden"
      />
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
}

export function ZoomTab({
  courseId,
  proximas,
  pasadas,
  canSchedule,
}: {
  courseId: string;
  /** Ya separadas por el servidor: el cliente no puede consultar «ahora» en render. */
  proximas: LiveClass[];
  pasadas: LiveClass[];
  /** Solo el docente dueño o un admin pueden programar clases. */
  canSchedule: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    provider: "ZOOM",
    scheduledAt: "",
    durationMin: "60",
    joinUrl: "",
    repetir: false,
    weeks: "16",
  });

  const refresh = () => startTransition(() => router.refresh());

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    let res: Response;
    try {
      res = await fetch("/api/live-classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          title: form.title,
          provider: form.provider,
          scheduledAt: form.scheduledAt,
          durationMin: Number(form.durationMin),
          joinUrl: form.joinUrl,
          weeks: form.repetir ? Number(form.weeks) : 1,
        }),
      });
    } catch {
      // Sin conexión, servidor caído, etc.: no se deja el botón bloqueado.
      setSaving(false);
      setError("No se pudo conectar con el servidor. Intenta de nuevo.");
      return;
    }

    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "No se pudo programar");
      return;
    }

    setSuccessMsg(
      data.count > 1
        ? `Se programaron ${data.count} clases semanales.`
        : "Clase programada."
    );
    setForm({
      title: "",
      provider: "ZOOM",
      scheduledAt: "",
      durationMin: "60",
      joinUrl: "",
      repetir: false,
      weeks: "16",
    });
    setCreating(false);
    refresh();
  };

  const eliminar = async (id: string) => {
    if (!confirm("¿Eliminar esta clase programada?")) return;
    await fetch(`/api/live-classes/${id}`, { method: "DELETE" });
    refresh();
  };

  const field =
    "rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none";

  return (
    <div className="space-y-4">
      {canSchedule && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="font-medium">Clases en vivo</p>
            <button
              onClick={() => setCreating((v) => !v)}
              className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
            >
              {creating ? "Cancelar" : "Programar clase"}
            </button>
          </div>

          {successMsg && !creating && (
            <p className="mt-2 text-xs font-medium text-green-700">✓ {successMsg}</p>
          )}

          {creating && (
            <form onSubmit={crear} className="mt-3 space-y-2">
              <input
                required
                placeholder="Título de la clase"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={`w-full ${field}`}
              />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <select
                  value={form.provider}
                  onChange={(e) => setForm({ ...form, provider: e.target.value })}
                  className={field}
                >
                  {Object.entries(PROVIDER_LABEL).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
                <input
                  type="datetime-local"
                  required
                  value={form.scheduledAt}
                  onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                  className={field}
                />
                <input
                  type="number"
                  min={15}
                  placeholder="Duración (min)"
                  value={form.durationMin}
                  onChange={(e) => setForm({ ...form, durationMin: e.target.value })}
                  className={field}
                />
              </div>
              <input
                type="url"
                placeholder="Enlace para unirse (https://...)"
                value={form.joinUrl}
                onChange={(e) => setForm({ ...form, joinUrl: e.target.value })}
                className={`w-full ${field}`}
              />

              <div className="flex flex-wrap items-center gap-3 rounded-lg bg-slate-50 px-3 py-2">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.repetir}
                    onChange={(e) => setForm({ ...form, repetir: e.target.checked })}
                  />
                  Repetir cada semana (todo el semestre)
                </label>
                {form.repetir && (
                  <label className="flex items-center gap-2 text-xs text-slate-600">
                    Número de semanas
                    <input
                      type="number"
                      min={2}
                      max={32}
                      value={form.weeks}
                      onChange={(e) => setForm({ ...form, weeks: e.target.value })}
                      className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </label>
                )}
              </div>
              {form.repetir && (
                <p className="text-[11px] text-slate-500">
                  Se creará una clase por semana, misma hora y enlace, a partir de la fecha elegida.
                </p>
              )}

              {error && <p className="text-xs text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-60"
              >
                {saving ? "Guardando..." : "Guardar clase"}
              </button>
            </form>
          )}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <p className="border-b border-slate-100 px-5 py-3 font-medium">Próximas clases</p>
        <ul className="divide-y divide-slate-100">
          {proximas.map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-5 py-3 text-sm">
              <span className="text-lg leading-none">🎥</span>
              <span className="flex-1">
                <span className="block font-medium">{c.title}</span>
                <span className="block text-xs text-slate-500">
                  {PROVIDER_LABEL[c.provider]} · {dateFmt.format(new Date(c.scheduledAt))} ·{" "}
                  {c.durationMin} min
                </span>
              </span>
              {c.joinUrl && (
                <a
                  href={c.joinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
                >
                  Unirse
                </a>
              )}
              {canSchedule && (
                <button
                  onClick={() => eliminar(c.id)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Eliminar
                </button>
              )}
            </li>
          ))}
          {proximas.length === 0 && (
            <li className="px-5 py-6 text-center text-sm text-slate-500">
              No hay clases programadas.
            </li>
          )}
        </ul>
      </div>

      {pasadas.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <p className="border-b border-slate-100 px-5 py-3 font-medium">Clases anteriores</p>
          <ul className="divide-y divide-slate-100">
            {pasadas.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                <span className="text-lg leading-none">🎬</span>
                <span className="flex-1">
                  <span className="block font-medium">{c.title}</span>
                  <span className="block text-xs text-slate-500">
                    {dateFmt.format(new Date(c.scheduledAt))}
                  </span>
                </span>
                {c.recordingUrl ? (
                  <a
                    href={c.recordingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50"
                  >
                    Ver grabación
                  </a>
                ) : canSchedule ? (
                  <SubirGrabacion classId={c.id} onDone={refresh} />
                ) : (
                  <span className="text-xs text-slate-400">Sin grabación</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
