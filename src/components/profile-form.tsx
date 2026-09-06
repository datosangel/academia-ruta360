"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

type Profile = {
  name: string;
  email: string;
  phone: string;
  documentId: string;
  bio: string;
  avatarUrl: string | null;
  roleLabel: string;
};

/** Reduce la foto a 256px y la devuelve como data URL JPEG, para no guardar
 *  archivos originales de varios MB en la base de datos. */
async function resizeImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen");

  // Recorte cuadrado centrado.
  const side = Math.min(bitmap.width, bitmap.height);
  ctx.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    size,
    size
  );

  return canvas.toDataURL("image/jpeg", 0.85);
}

export function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: profile.name,
    phone: profile.phone,
    documentId: profile.documentId,
    bio: profile.bio,
  });
  const [avatar, setAvatar] = useState<string | null>(profile.avatarUrl);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  const field =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

  const handlePickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen");
      return;
    }

    try {
      setAvatar(await resizeImage(file));
      setMessage("Foto lista. Pulsa «Guardar cambios» para aplicarla.");
    } catch {
      setError("No se pudo procesar la imagen");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, avatarUrl: avatar ?? "" }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo guardar");
      return;
    }

    setMessage("Perfil actualizado correctamente.");
    startTransition(() => router.refresh());
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwSaving(true);
    setPwError(null);
    setPwMessage(null);

    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pw),
    });

    setPwSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setPwError(data.error ?? "No se pudo cambiar la contraseña");
      return;
    }

    setPw({ currentPassword: "", newPassword: "" });
    setPwMessage("Contraseña actualizada.");
  };

  const initials = profile.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold">Configuración de mi perfil</h1>
        <p className="text-sm text-slate-600">
          Actualiza tu foto, tus datos personales y tu contraseña.
        </p>
      </div>

      {/* ---------- Datos personales ---------- */}
      <form
        onSubmit={handleSave}
        className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          {avatar ? (
            <Image
              src={avatar}
              alt="Tu foto de perfil"
              width={80}
              height={80}
              unoptimized
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-700 text-xl font-semibold text-white">
              {initials}
            </span>
          )}

          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handlePickPhoto}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
            >
              Cambiar foto
            </button>
            {avatar && (
              <button
                type="button"
                onClick={() => setAvatar(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
              >
                Quitar foto
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="text-xs font-medium text-slate-600">
            Nombre completo
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`mt-1 ${field}`}
            />
          </label>

          <label className="text-xs font-medium text-slate-600">
            Correo electrónico
            <input
              disabled
              value={profile.email}
              className={`mt-1 ${field} bg-slate-50 text-slate-500`}
            />
            <span className="mt-1 block font-normal text-slate-400">
              El correo lo cambia un administrador.
            </span>
          </label>

          <label className="text-xs font-medium text-slate-600">
            Teléfono
            <input
              value={form.phone}
              placeholder="Ej. 999 888 777"
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={`mt-1 ${field}`}
            />
          </label>

          <label className="text-xs font-medium text-slate-600">
            Documento de identidad
            <input
              value={form.documentId}
              placeholder="Ej. 12345678"
              onChange={(e) => setForm({ ...form, documentId: e.target.value })}
              className={`mt-1 ${field}`}
            />
          </label>
        </div>

        <label className="block text-xs font-medium text-slate-600">
          Sobre mí
          <textarea
            rows={3}
            value={form.bio}
            placeholder="Cuéntanos brevemente sobre ti (opcional)"
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            className={`mt-1 ${field}`}
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-700">{message}</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>

      {/* ---------- Contraseña ---------- */}
      <form
        onSubmit={handleChangePassword}
        className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <h2 className="font-semibold">Cambiar contraseña</h2>
          <p className="text-sm text-slate-600">
            Necesitas tu contraseña actual para confirmar el cambio.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="text-xs font-medium text-slate-600">
            Contraseña actual
            <input
              required
              type="password"
              value={pw.currentPassword}
              onChange={(e) =>
                setPw({ ...pw, currentPassword: e.target.value })
              }
              className={`mt-1 ${field}`}
            />
          </label>

          <label className="text-xs font-medium text-slate-600">
            Nueva contraseña
            <input
              required
              type="password"
              minLength={8}
              value={pw.newPassword}
              onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
              className={`mt-1 ${field}`}
            />
          </label>
        </div>

        {pwError && <p className="text-sm text-red-600">{pwError}</p>}
        {pwMessage && <p className="text-sm text-green-700">{pwMessage}</p>}

        <button
          type="submit"
          disabled={pwSaving}
          className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60"
        >
          {pwSaving ? "Cambiando..." : "Cambiar contraseña"}
        </button>
      </form>
    </div>
  );
}
