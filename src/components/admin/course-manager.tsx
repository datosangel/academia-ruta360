"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Course = {
  id: string;
  title: string;
  description: string;
  level: string;
  status: string;
  durationHrs: number | null;
  categoryId: string | null;
  teacherId: string;
  teacherName: string;
  categoryName: string | null;
  startDate: string | null;
  endDate: string | null;
  moduleCount: number;
  studentCount: number;
};

type Option = { id: string; name: string };

const LEVELS = [
  { value: "BASICO", label: "Básico" },
  { value: "INTERMEDIO", label: "Intermedio" },
  { value: "AVANZADO", label: "Avanzado" },
];

const STATUSES = [
  { value: "BORRADOR", label: "Borrador" },
  { value: "PUBLICADO", label: "Publicado" },
  { value: "FINALIZADO", label: "Finalizado" },
  { value: "ARCHIVADO", label: "Archivado" },
];

const STATUS_STYLE: Record<string, string> = {
  BORRADOR: "bg-amber-100 text-amber-700",
  PUBLICADO: "bg-green-100 text-green-700",
  FINALIZADO: "bg-slate-200 text-slate-600",
  ARCHIVADO: "bg-slate-200 text-slate-500",
};

const emptyForm = {
  title: "",
  description: "",
  imageUrl: "",
  categoryId: "",
  durationHrs: "",
  level: "BASICO",
  status: "BORRADOR",
  teacherId: "",
  startDate: "",
  endDate: "",
};

export function CourseManager({
  courses,
  teachers,
  categories,
  canAssignTeacher,
  defaultTeacherId,
  editorBasePath,
  initialStatus,
}: {
  courses: Course[];
  teachers: Option[];
  categories: Option[];
  /** Solo el administrador puede elegir a qué docente pertenece el curso. */
  canAssignTeacher: boolean;
  defaultTeacherId: string;
  /** Ruta base del editor de contenidos, p. ej. "/docente/cursos". */
  editorBasePath: string;
  /** Filtro de estado con el que llega la página, p. ej. desde el dashboard. */
  initialStatus?: string | null;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm, teacherId: defaultTeacherId });
  const [statusFilter, setStatusFilter] = useState<string | null>(
    initialStatus ?? null
  );

  const visibleCourses = statusFilter
    ? courses.filter((c) => c.status === statusFilter)
    : courses;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      teacherId: canAssignTeacher ? form.teacherId : defaultTeacherId,
      durationHrs: form.durationHrs ? Number(form.durationHrs) : undefined,
    };

    const ok = editingId
      ? await request(`/api/courses/${editingId}`, "PATCH", payload)
      : await request("/api/courses", "POST", payload);

    if (ok) {
      setForm({ ...emptyForm, teacherId: defaultTeacherId });
      setCreating(false);
      setEditingId(null);
      refresh();
    }
  };

  const startEdit = (course: Course) => {
    setEditingId(course.id);
    setCreating(true);
    setForm({
      title: course.title,
      description: course.description,
      imageUrl: "",
      categoryId: course.categoryId ?? "",
      durationHrs: course.durationHrs ? String(course.durationHrs) : "",
      level: course.level,
      status: course.status,
      teacherId: course.teacherId,
      startDate: course.startDate?.slice(0, 10) ?? "",
      endDate: course.endDate?.slice(0, 10) ?? "",
    });
  };

  const handleDelete = async (course: Course) => {
    if (!confirm(`¿Eliminar el curso "${course.title}"?`)) return;
    if (await request(`/api/courses/${course.id}`, "DELETE")) refresh();
  };

  const field =
    "rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Cursos</h1>
          <p className="text-sm text-slate-600">
            {visibleCourses.length} de {courses.length} curso(s)
          </p>
        </div>
        <button
          onClick={() => {
            setCreating((v) => !v);
            setEditingId(null);
            setForm({ ...emptyForm, teacherId: defaultTeacherId });
          }}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          {creating ? "Cancelar" : "Nuevo curso"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter(null)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
            statusFilter === null
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Todos
        </button>
        {STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => setStatusFilter(s.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              statusFilter === s.value
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {creating && (
        <form
          onSubmit={handleSubmit}
          className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p className="font-medium">
            {editingId ? "Editar curso" : "Nuevo curso"}
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              required
              placeholder="Nombre del curso"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={field}
            />
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className={field}
            >
              <option value="">Sin categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <textarea
            required
            rows={2}
            placeholder="Descripción del curso"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className={`w-full ${field}`}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <select
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value })}
              className={field}
            >
              {LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>

            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className={field}
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            <input
              type="number"
              min={1}
              placeholder="Duración (horas)"
              value={form.durationHrs}
              onChange={(e) => setForm({ ...form, durationHrs: e.target.value })}
              className={field}
            />

            {canAssignTeacher ? (
              <select
                required
                value={form.teacherId}
                onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
                className={field}
              >
                <option value="">Asignar docente...</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                disabled
                value="Tú serás el docente"
                className={`${field} bg-slate-50 text-slate-500`}
              />
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-xs text-slate-500">
              Fecha de inicio
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className={`mt-1 w-full ${field}`}
              />
            </label>
            <label className="text-xs text-slate-500">
              Fecha de finalización
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className={`mt-1 w-full ${field}`}
              />
            </label>
          </div>

          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            {editingId ? "Guardar cambios" : "Crear curso"}
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Curso</th>
              <th className="px-4 py-3">Docente</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Módulos</th>
              <th className="px-4 py-3">Alumnos</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleCourses.map((course) => (
              <tr key={course.id}>
                <td className="px-4 py-3">
                  <p className="font-medium">{course.title}</p>
                  <p className="text-xs text-slate-500">
                    {course.categoryName ?? "Sin categoría"}
                    {course.durationHrs ? ` · ${course.durationHrs} h` : ""}
                  </p>
                </td>
                <td className="px-4 py-3 text-slate-600">{course.teacherName}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      STATUS_STYLE[course.status]
                    }`}
                  >
                    {STATUSES.find((s) => s.value === course.status)?.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{course.moduleCount}</td>
                <td className="px-4 py-3 text-slate-600">{course.studentCount}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`${editorBasePath}/${course.id}/alumnos`}
                      className="rounded border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50"
                    >
                      Alumnos
                    </Link>
                    <Link
                      href={`${editorBasePath}/${course.id}`}
                      className="rounded border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50"
                    >
                      Contenidos
                    </Link>
                    <button
                      onClick={() => startEdit(course)}
                      className="rounded border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(course)}
                      className="rounded border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {visibleCourses.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  {courses.length === 0
                    ? "Todavía no hay cursos. Crea el primero."
                    : "Ningún curso coincide con el filtro."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
