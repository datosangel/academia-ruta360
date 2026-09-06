"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
  /** Cursos a cargo (docente) o matriculados (alumno). */
  courseCount: number;
};

const ROLES = ["ADMIN", "DOCENTE", "ALUMNO"] as const;
const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  DOCENTE: "Docente",
  ALUMNO: "Alumno",
};

export function UserManager({
  users,
  currentUserId,
  initialRole,
}: {
  users: User[];
  currentUserId: string;
  /** Filtro de rol con el que llega la página, p. ej. desde el dashboard. */
  initialRole?: string | null;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string | null>(initialRole ?? null);
  const [search, setSearch] = useState("");

  const visibleUsers = users.filter((u) => {
    if (roleFilter && u.role !== roleFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  // Carga masiva desde Excel/CSV
  const [importing, setImporting] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{
    created: number;
    enrolled: number;
    skipped: { row: number; email: string; reason: string }[];
    credentials: { name: string; email: string; tempPassword: string }[];
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportBusy(true);
    setImportError(null);
    setImportResult(null);

    const fd = new FormData();
    fd.append("file", file);

    let res: Response;
    try {
      res = await fetch("/api/users/bulk-import", { method: "POST", body: fd });
    } catch {
      setImportBusy(false);
      setImportError("No se pudo conectar con el servidor.");
      return;
    }
    const data = await res.json().catch(() => ({}));
    setImportBusy(false);
    if (!res.ok) {
      setImportError(data.error ?? "No se pudo importar el archivo");
      return;
    }

    setImportResult(data);
    if (fileRef.current) fileRef.current.value = "";
    refresh();
  };

  const descargarCredenciales = () => {
    if (!importResult) return;
    const rows = [
      ["Nombre", "Correo", "Contraseña temporal"],
      ...importResult.credentials.map((c) => [c.name, c.email, c.tempPassword]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "credenciales-nuevos-usuarios.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Formulario de creación
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "ALUMNO",
  });
  // Formulario de edición en línea
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "" });

  const refresh = () => startTransition(() => router.refresh());

  const request = async (url: string, method: string, body?: object) => {
    setError(null);
    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      // Sin conexión, servidor caído, etc.: no se deja el botón bloqueado.
      setError("No se pudo conectar con el servidor. Intenta de nuevo.");
      return false;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Ocurrió un error");
      return false;
    }
    return true;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await request("/api/users", "POST", form)) {
      setForm({ name: "", email: "", password: "", role: "ALUMNO" });
      setCreating(false);
      refresh();
    }
  };

  const startEdit = (user: User) => {
    setEditingId(user.id);
    setEditForm({ name: user.name, email: user.email, role: user.role });
  };

  const handleSaveEdit = async (id: string) => {
    if (await request(`/api/users/${id}`, "PATCH", editForm)) {
      setEditingId(null);
      refresh();
    }
  };

  const handleToggleActive = async (user: User) => {
    if (await request(`/api/users/${user.id}`, "PATCH", { active: !user.active })) {
      refresh();
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`¿Eliminar a ${user.name}? Esta acción no se puede deshacer.`))
      return;
    if (await request(`/api/users/${user.id}`, "DELETE")) refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Usuarios</h1>
          <p className="text-sm text-slate-600">
            {visibleUsers.length} de {users.length} usuario(s)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setImporting((v) => !v)}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {importing ? "Cerrar" : "📥 Importar Excel"}
          </button>
          <button
            onClick={() => setCreating((v) => !v)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
          >
            {creating ? "Cancelar" : "Nuevo usuario"}
          </button>
        </div>
      </div>

      {importing && (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <p className="font-medium">Carga masiva de alumnos</p>
            <p className="text-sm text-slate-600">
              Descarga la plantilla, complétala en Excel (columnas Nombre y Correo obligatorias) y
              súbela aquí. Cada fila crea una cuenta con contraseña temporal.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Descarga un archivo (no navega a una página), por eso es <a> y no <Link>. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/api/users/template"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              ⬇ Descargar plantilla
            </a>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={importBusy}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {importBusy ? "Importando..." : "Subir archivo completado"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleImportFile}
              className="hidden"
            />
          </div>

          {importError && <p className="text-sm text-red-600">{importError}</p>}

          {importResult && (
            <div className="space-y-2 rounded-lg bg-slate-50 p-4 text-sm">
              <p>
                <span className="font-semibold text-green-700">{importResult.created}</span> cuenta(s)
                creada(s) · <span className="font-semibold">{importResult.enrolled}</span> matrícula(s) ·{" "}
                <span className="font-semibold text-amber-700">{importResult.skipped.length}</span> fila(s)
                omitida(s)
              </p>

              {importResult.credentials.length > 0 && (
                <button
                  onClick={descargarCredenciales}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-slate-100"
                >
                  ⬇ Descargar contraseñas temporales
                </button>
              )}

              {importResult.skipped.length > 0 && (
                <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-slate-600">
                  {importResult.skipped.map((s, i) => (
                    <li key={i}>
                      Fila {s.row} ({s.email}): {s.reason}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setRoleFilter(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              roleFilter === null
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Todos
          </button>
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                roleFilter === r
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {ROLE_LABEL[r]}
            </button>
          ))}
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o correo..."
          className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none sm:w-64"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {creating && (
        <form
          onSubmit={handleCreate}
          className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-5"
        >
          <input
            required
            placeholder="Nombre completo"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <input
            required
            type="email"
            placeholder="Correo"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <input
            required
            type="password"
            minLength={8}
            placeholder="Contraseña (mín. 8)"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Crear usuario
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Correo</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Cursos</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleUsers.map((user) => {
              const isSelf = user.id === currentUserId;
              const isEditing = editingId === user.id;

              return (
                <tr key={user.id}>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                        className="w-full rounded border border-slate-300 px-2 py-1"
                      />
                    ) : (
                      <span className="font-medium">
                        {user.name}
                        {isSelf && (
                          <span className="ml-2 text-xs text-slate-400">
                            (tú)
                          </span>
                        )}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {isEditing ? (
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) =>
                          setEditForm({ ...editForm, email: e.target.value })
                        }
                        className="w-full rounded border border-slate-300 px-2 py-1"
                      />
                    ) : (
                      user.email
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing && !isSelf ? (
                      <select
                        value={editForm.role}
                        onChange={(e) =>
                          setEditForm({ ...editForm, role: e.target.value })
                        }
                        className="rounded border border-slate-300 px-2 py-1"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABEL[r]}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                        {ROLE_LABEL[user.role]}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {user.role === "ADMIN" ? (
                      <span className="text-xs text-slate-400">—</span>
                    ) : (
                      user.courseCount
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.active
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {user.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(user.id)}
                            className="rounded bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-500"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="rounded border border-slate-300 px-3 py-1 text-xs"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          {user.role !== "ADMIN" && (
                            <Link
                              href={`/admin/usuarios/${user.id}`}
                              className="rounded border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50"
                            >
                              Ficha
                            </Link>
                          )}
                          <button
                            onClick={() => startEdit(user)}
                            className="rounded border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50"
                          >
                            Editar
                          </button>
                          {!isSelf && (
                            <>
                              <button
                                onClick={() => handleToggleActive(user)}
                                className="rounded border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50"
                              >
                                {user.active ? "Desactivar" : "Activar"}
                              </button>
                              <button
                                onClick={() => handleDelete(user)}
                                className="rounded border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                              >
                                Eliminar
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {visibleUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  Ningún usuario coincide con el filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
