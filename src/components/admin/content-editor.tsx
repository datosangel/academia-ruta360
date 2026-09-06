"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { formatDueDate } from "@/lib/format";
import { AnnouncementPanel } from "@/components/announcement-panel";
import { FileUploadField } from "@/components/file-upload-field";

type Lesson = {
  id: string;
  title: string;
  type: string;
  contentUrl: string | null;
  body: string | null;
};

type Quiz = { id: string; title: string; questionCount: number };

type Assignment = {
  id: string;
  title: string;
  dueDate: string | null;
  submissionCount: number;
  pendingCount: number;
};

type Module = {
  id: string;
  title: string;
  lessons: Lesson[];
  quizzes: Quiz[];
  assignments: Assignment[];
};

const LESSON_TYPES = [
  { value: "VIDEO", label: "Video" },
  { value: "PDF", label: "PDF" },
  { value: "PRESENTACION", label: "Presentación" },
  { value: "ARCHIVO", label: "Archivo descargable" },
  { value: "LINK_EXTERNO", label: "Enlace externo" },
  { value: "ACTIVIDAD", label: "Actividad" },
];

const TYPE_ICON: Record<string, string> = {
  VIDEO: "▶",
  PDF: "📄",
  PRESENTACION: "📊",
  ARCHIVO: "📎",
  LINK_EXTERNO: "🔗",
  ACTIVIDAD: "📝",
};

type Announcement = {
  id: string;
  title: string;
  body: string;
  authorName: string;
  createdAt: string;
};

export function ContentEditor({
  courseTitle,
  courseId,
  modules,
  announcements,
  backHref,
  quizBaseHref,
  assignmentBaseHref,
}: {
  courseTitle: string;
  announcements: Announcement[];
  courseId: string;
  modules: Module[];
  backHref: string;
  /** Ruta base del editor de evaluaciones, p. ej. "/docente/evaluaciones". */
  quizBaseHref: string;
  /** Ruta base para revisar entregas, p. ej. "/docente/tareas". */
  assignmentBaseHref: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [newModule, setNewModule] = useState("");
  const [lessonFormFor, setLessonFormFor] = useState<string | null>(null);
  const [lessonForm, setLessonForm] = useState({
    title: "",
    type: "VIDEO",
    contentUrl: "",
    body: "",
  });

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

  const addModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await request("/api/modules", "POST", { courseId, title: newModule })) {
      setNewModule("");
      refresh();
    }
  };

  const renameModule = async (mod: Module) => {
    const title = prompt("Nuevo nombre de la semana:", mod.title);
    if (!title || title === mod.title) return;
    if (await request(`/api/modules/${mod.id}`, "PATCH", { title })) refresh();
  };

  const deleteModule = async (mod: Module) => {
    if (
      !confirm(
        `¿Eliminar la semana "${mod.title}" y sus ${mod.lessons.length} lección(es)?`
      )
    )
      return;
    if (await request(`/api/modules/${mod.id}`, "DELETE")) refresh();
  };

  const addLesson = async (e: React.FormEvent, moduleId: string) => {
    e.preventDefault();
    if (await request("/api/lessons", "POST", { moduleId, ...lessonForm })) {
      setLessonForm({ title: "", type: "VIDEO", contentUrl: "", body: "" });
      setLessonFormFor(null);
      refresh();
    }
  };

  const deleteLesson = async (lesson: Lesson) => {
    if (!confirm(`¿Eliminar la lección "${lesson.title}"?`)) return;
    if (await request(`/api/lessons/${lesson.id}`, "DELETE")) refresh();
  };

  const addQuiz = async (moduleId: string) => {
    const title = prompt(
      "Nombre de la evaluación:",
      "Evaluación de la semana"
    );
    if (!title) return;
    if (await request("/api/quizzes", "POST", { moduleId, title })) refresh();
  };

  const [assignmentFormFor, setAssignmentFormFor] = useState<string | null>(
    null
  );
  const [assignmentForm, setAssignmentForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    maxScore: "20",
    attachmentUrl: "",
  });

  const addAssignment = async (e: React.FormEvent, moduleId: string) => {
    e.preventDefault();
    const ok = await request("/api/assignments", "POST", {
      moduleId,
      ...assignmentForm,
      maxScore: Number(assignmentForm.maxScore),
    });
    if (ok) {
      setAssignmentForm({ title: "", description: "", dueDate: "", maxScore: "20", attachmentUrl: "" });
      setAssignmentFormFor(null);
      refresh();
    }
  };

  const deleteAssignment = async (a: Assignment) => {
    if (
      !confirm(
        `¿Eliminar la tarea "${a.title}"? Se borran también las entregas de los alumnos.`
      )
    )
      return;
    if (await request(`/api/assignments/${a.id}`, "DELETE")) refresh();
  };

  const deleteQuiz = async (quiz: Quiz) => {
    if (
      !confirm(
        `¿Eliminar la evaluación "${quiz.title}"? Se borran también sus preguntas y los intentos rendidos.`
      )
    )
      return;
    if (await request(`/api/quizzes/${quiz.id}`, "DELETE")) refresh();
  };

  const field =
    "rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none";

  return (
    <div className="space-y-5">
      <div>
        <Link
          href={backHref}
          className="text-xs font-medium text-slate-500 hover:text-indigo-600"
        >
          ← Volver a cursos
        </Link>
        <h1 className="mt-2 text-xl font-bold">{courseTitle}</h1>
        <p className="text-sm text-slate-600">
          {modules.length} semana(s) ·{" "}
          {modules.reduce((n, m) => n + m.lessons.length, 0)} lección(es)
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <AnnouncementPanel courseId={courseId} announcements={announcements} canPost />

      <form
        onSubmit={addModule}
        className="flex gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <input
          required
          placeholder="Nombre de la nueva semana (ej. Introducción)"
          value={newModule}
          onChange={(e) => setNewModule(e.target.value)}
          className={`flex-1 ${field}`}
        />
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          Añadir semana
        </button>
      </form>

      <div className="space-y-4">
        {modules.map((mod, i) => (
          <div
            key={mod.id}
            className="rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <p className="font-medium">
                <span className="text-slate-400">
                  Semana {String(i + 1).padStart(2, "0")}:
                </span>{" "}
                {mod.title}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => renameModule(mod)}
                  className="rounded border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50"
                >
                  Renombrar
                </button>
                <button
                  onClick={() => deleteModule(mod)}
                  className="rounded border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                >
                  Eliminar
                </button>
              </div>
            </div>

            <ul className="divide-y divide-slate-100">
              {mod.lessons.map((lesson) => (
                <li
                  key={lesson.id}
                  className="flex items-center gap-3 px-5 py-2.5 text-sm"
                >
                  <span>{TYPE_ICON[lesson.type] ?? "•"}</span>
                  <span className="flex-1">{lesson.title}</span>
                  <span className="text-xs text-slate-400">
                    {LESSON_TYPES.find((t) => t.value === lesson.type)?.label}
                  </span>
                  <button
                    onClick={() => deleteLesson(lesson)}
                    className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-600 hover:bg-red-50"
                  >
                    Eliminar
                  </button>
                </li>
              ))}
              {mod.lessons.length === 0 && (
                <li className="px-5 py-3 text-sm text-slate-500">
                  Esta semana aún no tiene contenido.
                </li>
              )}
            </ul>

            {/* ---------- Evaluaciones de la semana ---------- */}
            <div className="border-t border-slate-100 bg-slate-50/60">
              <div className="flex items-center justify-between px-5 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Evaluaciones
                </p>
                <button
                  onClick={() => addQuiz(mod.id)}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                >
                  + Añadir evaluación
                </button>
              </div>

              <ul className="divide-y divide-slate-100 border-t border-slate-100">
                {mod.quizzes.map((quiz) => (
                  <li
                    key={quiz.id}
                    className="flex items-center gap-3 px-5 py-2.5 text-sm"
                  >
                    <span>🧠</span>
                    <span className="flex-1">{quiz.title}</span>
                    <span className="text-xs text-slate-400">
                      {quiz.questionCount} pregunta(s)
                    </span>
                    <Link
                      href={`${quizBaseHref}/${quiz.id}`}
                      className="rounded border border-slate-300 bg-white px-3 py-1 text-xs hover:bg-slate-50"
                    >
                      Preguntas y notas
                    </Link>
                    <button
                      onClick={() => deleteQuiz(quiz)}
                      className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-600 hover:bg-red-50"
                    >
                      Eliminar
                    </button>
                  </li>
                ))}
                {mod.quizzes.length === 0 && (
                  <li className="px-5 py-2.5 text-xs text-slate-500">
                    Sin evaluaciones en esta semana.
                  </li>
                )}
              </ul>
            </div>

            {/* ---------- Tareas de la semana ---------- */}
            <div className="border-t border-slate-100 bg-slate-50/60">
              <div className="flex items-center justify-between px-5 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Tareas
                </p>
                <button
                  onClick={() =>
                    setAssignmentFormFor(
                      assignmentFormFor === mod.id ? null : mod.id
                    )
                  }
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                >
                  {assignmentFormFor === mod.id ? "Cancelar" : "+ Añadir tarea"}
                </button>
              </div>

              {assignmentFormFor === mod.id && (
                <form
                  onSubmit={(e) => addAssignment(e, mod.id)}
                  className="space-y-2 border-t border-slate-100 px-5 py-3"
                >
                  <input
                    required
                    placeholder="Título de la tarea"
                    value={assignmentForm.title}
                    onChange={(e) =>
                      setAssignmentForm({ ...assignmentForm, title: e.target.value })
                    }
                    className={`w-full ${field}`}
                  />
                  <textarea
                    required
                    rows={2}
                    placeholder="Instrucciones para el alumno"
                    value={assignmentForm.description}
                    onChange={(e) =>
                      setAssignmentForm({
                        ...assignmentForm,
                        description: e.target.value,
                      })
                    }
                    className={`w-full ${field}`}
                  />
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <label className="text-xs text-slate-500">
                      Fecha límite (opcional)
                      <input
                        type="date"
                        value={assignmentForm.dueDate}
                        onChange={(e) =>
                          setAssignmentForm({
                            ...assignmentForm,
                            dueDate: e.target.value,
                          })
                        }
                        className={`mt-1 w-full ${field}`}
                      />
                    </label>
                    <label className="text-xs text-slate-500">
                      Puntaje máximo
                      <input
                        type="number"
                        min={1}
                        required
                        value={assignmentForm.maxScore}
                        onChange={(e) =>
                          setAssignmentForm({
                            ...assignmentForm,
                            maxScore: e.target.value,
                          })
                        }
                        className={`mt-1 w-full ${field}`}
                      />
                    </label>
                  </div>
                  <FileUploadField
                    value={assignmentForm.attachmentUrl}
                    onChange={(url) => setAssignmentForm({ ...assignmentForm, attachmentUrl: url })}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                    placeholder="Material adjunto (opcional): pega un enlace o sube un archivo →"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
                  >
                    Guardar tarea
                  </button>
                </form>
              )}

              <ul className="divide-y divide-slate-100 border-t border-slate-100">
                {mod.assignments.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center gap-3 px-5 py-2.5 text-sm"
                  >
                    <span>📝</span>
                    <span className="flex-1">
                      {a.title}
                      {a.dueDate && (
                        <span className="block text-[11px] text-slate-400">
                          Vence: {formatDueDate(a.dueDate)}
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-slate-400">
                      {a.submissionCount} entrega(s)
                    </span>
                    {a.pendingCount > 0 && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                        {a.pendingCount} por revisar
                      </span>
                    )}
                    <Link
                      href={`${assignmentBaseHref}/${a.id}`}
                      className="rounded border border-slate-300 bg-white px-3 py-1 text-xs hover:bg-slate-50"
                    >
                      Ver entregas
                    </Link>
                    <button
                      onClick={() => deleteAssignment(a)}
                      className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-600 hover:bg-red-50"
                    >
                      Eliminar
                    </button>
                  </li>
                ))}
                {mod.assignments.length === 0 && (
                  <li className="px-5 py-2.5 text-xs text-slate-500">
                    Sin tareas en esta semana.
                  </li>
                )}
              </ul>
            </div>

            <div className="border-t border-slate-100 px-5 py-3">
              {lessonFormFor === mod.id ? (
                <form
                  onSubmit={(e) => addLesson(e, mod.id)}
                  className="space-y-2"
                >
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <input
                      required
                      placeholder="Título de la lección"
                      value={lessonForm.title}
                      onChange={(e) =>
                        setLessonForm({ ...lessonForm, title: e.target.value })
                      }
                      className={field}
                    />
                    <select
                      value={lessonForm.type}
                      onChange={(e) =>
                        setLessonForm({ ...lessonForm, type: e.target.value })
                      }
                      className={field}
                    >
                      {LESSON_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {lessonForm.type === "LINK_EXTERNO" && (
                    <input
                      type="url"
                      placeholder="URL del enlace externo"
                      value={lessonForm.contentUrl}
                      onChange={(e) =>
                        setLessonForm({
                          ...lessonForm,
                          contentUrl: e.target.value,
                        })
                      }
                      className={`w-full ${field}`}
                    />
                  )}

                  {(lessonForm.type === "VIDEO" ||
                    lessonForm.type === "PDF" ||
                    lessonForm.type === "PRESENTACION" ||
                    lessonForm.type === "ARCHIVO") && (
                    <FileUploadField
                      value={lessonForm.contentUrl}
                      onChange={(url) => setLessonForm({ ...lessonForm, contentUrl: url })}
                      accept={
                        lessonForm.type === "VIDEO"
                          ? "video/mp4,video/webm,video/quicktime"
                          : lessonForm.type === "PRESENTACION"
                            ? ".ppt,.pptx,.pdf"
                            : lessonForm.type === "PDF"
                              ? ".pdf"
                              : ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                      }
                      placeholder={
                        lessonForm.type === "VIDEO"
                          ? "Pega el enlace del video (YouTube, Drive...), o sube el archivo →"
                          : "Pega un enlace, o sube el archivo →"
                      }
                    />
                  )}

                  <textarea
                    rows={2}
                    placeholder="Descripción o instrucciones (opcional)"
                    value={lessonForm.body}
                    onChange={(e) =>
                      setLessonForm({ ...lessonForm, body: e.target.value })
                    }
                    className={`w-full ${field}`}
                  />

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
                    >
                      Guardar lección
                    </button>
                    <button
                      type="button"
                      onClick={() => setLessonFormFor(null)}
                      className="rounded-lg border border-slate-300 px-4 py-1.5 text-xs"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => {
                    setLessonFormFor(mod.id);
                    setLessonForm({
                      title: "",
                      type: "VIDEO",
                      contentUrl: "",
                      body: "",
                    });
                  }}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  + Añadir contenido
                </button>
              )}
            </div>
          </div>
        ))}

        {modules.length === 0 && (
          <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
            Este curso aún no tiene semanas. Añade la primera arriba.
          </p>
        )}
      </div>
    </div>
  );
}
