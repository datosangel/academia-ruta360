import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/stat-card";

const LEVEL_LABEL: Record<string, string> = {
  BASICO: "Básico",
  INTERMEDIO: "Intermedio",
  AVANZADO: "Avanzado",
};

export default async function DocenteDashboard() {
  const session = await auth();
  const teacherId = session!.user.id;

  const courses = await prisma.course.findMany({
    where: { teacherId },
    orderBy: { title: "asc" },
    include: {
      category: true,
      enrollments: true,
      modules: {
        include: { assignments: { include: { submissions: true } } },
      },
    },
  });

  const totalStudents = new Set(
    courses.flatMap((c) => c.enrollments.map((e) => e.studentId))
  ).size;

  const avgProgress =
    courses.flatMap((c) => c.enrollments).reduce((sum, e) => sum + e.progressPct, 0) /
    (courses.flatMap((c) => c.enrollments).length || 1);

  const pendingSubmissions = courses
    .flatMap((c) => c.modules)
    .flatMap((m) => m.assignments)
    .flatMap((a) => a.submissions)
    .filter((s) => s.status === "ENTREGADO").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Panel del docente</h1>
        <p className="text-sm text-slate-600">
          Bienvenido/a, {session?.user?.name} · {courses.length} curso(s) a tu cargo
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Alumnos" value={totalStudents} icon="👥" accent="brand" />
        <StatCard label="Avance promedio" value={`${Math.round(avgProgress)}%`} icon="📈" accent="green" />
        <StatCard
          label="Entregas por revisar"
          value={pendingSubmissions}
          icon="📝"
          accent={pendingSubmissions > 0 ? "amber" : "green"}
          href="/docente/tareas"
        />
      </div>

      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-semibold">Mis cursos</h2>
          <Link href="/docente/cursos" className="text-xs font-medium text-indigo-600 hover:text-indigo-500">
            Gestionar cursos →
          </Link>
        </div>

        {courses.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
            Aún no tienes cursos asignados.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => {
              const entregasPendientes = course.modules
                .flatMap((m) => m.assignments)
                .flatMap((a) => a.submissions)
                .filter((s) => s.status === "ENTREGADO").length;

              return (
                <Link
                  key={course.id}
                  href={`/docente/cursos/${course.id}`}
                  className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex h-24 items-center justify-center bg-gradient-to-br from-[#013C9A] to-[#3BB546] text-2xl font-bold text-white/90">
                    {course.title.charAt(0)}
                  </div>

                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <div className="flex flex-wrap gap-1.5">
                      {course.category && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                          {course.category.name}
                        </span>
                      )}
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        {LEVEL_LABEL[course.level]}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        {course.status === "PUBLICADO" ? "Publicado" : course.status === "BORRADOR" ? "Borrador" : course.status}
                      </span>
                    </div>

                    <p className="font-medium leading-snug">{course.title}</p>

                    <div className="mt-auto flex items-center justify-between pt-2 text-xs text-slate-500">
                      <span>{course.enrollments.length} alumno(s)</span>
                      {entregasPendientes > 0 ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800">
                          {entregasPendientes} por revisar
                        </span>
                      ) : (
                        <span className="text-slate-400">Al día</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
