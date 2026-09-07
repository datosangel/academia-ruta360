import Link from "next/link";

const dateFmt = new Intl.DateTimeFormat("es", { day: "2-digit", month: "short", year: "numeric" });

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  DOCENTE: "Docente",
  ALUMNO: "Alumno",
};

type Profile = {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  documentId: string | null;
  bio: string | null;
  active: boolean;
  createdAt: string;
  enrollments: {
    courseId: string;
    courseTitle: string;
    progressPct: number;
    enrolledAt: string;
    completedAt: string | null;
  }[];
  coursesTaught: { id: string; title: string; status: string; studentCount: number }[];
  approvedTasks: number;
  quizzesTaken: number;
};

export function UserProfile({ data, backHref }: { data: Profile; backHref: string }) {
  const avgProgress =
    data.enrollments.length > 0
      ? Math.round(
          data.enrollments.reduce((s, e) => s + e.progressPct, 0) / data.enrollments.length
        )
      : 0;

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <Link href={backHref} className="text-xs font-medium text-slate-500 hover:text-indigo-600">
          ← Volver a usuarios
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-xl font-bold">{data.name}</h1>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
            {ROLE_LABEL[data.role]}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              data.active ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"
            }`}
          >
            {data.active ? "Activo" : "Inactivo"}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-slate-500">Correo</dt>
            <dd>{data.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Teléfono</dt>
            <dd>{data.phone ?? <span className="text-slate-400">Sin registrar</span>}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Documento</dt>
            <dd>{data.documentId ?? <span className="text-slate-400">Sin registrar</span>}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Miembro desde</dt>
            <dd>{dateFmt.format(new Date(data.createdAt))}</dd>
          </div>
        </dl>
        {data.bio && <p className="mt-3 whitespace-pre-line text-sm text-slate-600">{data.bio}</p>}
      </div>

      {data.role === "ALUMNO" && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">Cursos</p>
              <p className="mt-0.5 text-lg font-bold">{data.enrollments.length}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">Avance promedio</p>
              <p className="mt-0.5 text-lg font-bold">{avgProgress}%</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">Trabajos aprobados</p>
              <p className="mt-0.5 text-lg font-bold">{data.approvedTasks}</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <p className="border-b border-slate-100 px-5 py-3 font-medium">Cursos matriculados</p>
            <ul className="divide-y divide-slate-100">
              {data.enrollments.map((e) => (
                <li key={e.courseId} className="flex items-center justify-between px-5 py-3 text-sm">
                  <div>
                    <p className="font-medium">{e.courseTitle}</p>
                    <p className="text-xs text-slate-500">
                      Matriculado {dateFmt.format(new Date(e.enrolledAt))}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-indigo-600"
                        style={{ width: `${e.progressPct}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500">{e.progressPct}%</span>
                  </div>
                </li>
              ))}
              {data.enrollments.length === 0 && (
                <li className="px-5 py-6 text-center text-sm text-slate-500">
                  No está matriculado en ningún curso.
                </li>
              )}
            </ul>
          </div>
        </>
      )}

      {data.role === "DOCENTE" && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <p className="border-b border-slate-100 px-5 py-3 font-medium">Cursos a cargo</p>
          <ul className="divide-y divide-slate-100">
            {data.coursesTaught.map((c) => (
              <li key={c.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <span>{c.title}</span>
                <span className="text-xs text-slate-500">{c.studentCount} alumno(s)</span>
              </li>
            ))}
            {data.coursesTaught.length === 0 && (
              <li className="px-5 py-6 text-center text-sm text-slate-500">
                No tiene cursos asignados.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
