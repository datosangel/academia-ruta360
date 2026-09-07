import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/stat-card";
import { EnrollButton } from "@/components/enroll-button";

const LEVEL_LABEL: Record<string, string> = {
  BASICO: "Básico",
  INTERMEDIO: "Intermedio",
  AVANZADO: "Avanzado",
};

export default async function AlumnoDashboard() {
  const session = await auth();
  const studentId = session!.user.id;

  const [courses, enrollments, pendingAssignments, correctionCount] = await Promise.all([
    // Todos los cursos publicados de la academia, no solo en los que ya
    // estás matriculado: así el alumno ve toda la oferta disponible.
    prisma.course.findMany({
      where: { status: "PUBLICADO" },
      orderBy: { title: "asc" },
      include: {
        category: true,
        teacher: { select: { name: true } },
        _count: { select: { modules: true } },
      },
    }),
    prisma.enrollment.findMany({
      where: { studentId },
      select: { courseId: true, progressPct: true },
    }),
    prisma.assignment.count({
      where: {
        module: { course: { enrollments: { some: { studentId } } } },
        submissions: { none: { studentId } },
      },
    }),
    prisma.submission.count({ where: { studentId, status: "REQUIERE_CORRECCION" } }),
  ]);

  const enrolledMap = new Map(enrollments.map((e) => [e.courseId, e]));
  const avgProgress =
    enrollments.reduce((sum, e) => sum + e.progressPct, 0) /
    (enrollments.length || 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Mi panel</h1>
        <p className="text-sm text-slate-600">
          Bienvenido/a, {session?.user?.name}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Cursos inscritos" value={enrollments.length} />
        <StatCard label="Progreso promedio" value={`${Math.round(avgProgress)}%`} />
        <StatCard label="Actividades pendientes" value={pendingAssignments} />
        <StatCard label="Requieren corrección" value={correctionCount} />
      </div>

      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-semibold">Cursos</h2>
          <p className="text-xs text-slate-500">
            {courses.length} curso(s) disponibles en la academia
          </p>
        </div>

        {courses.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
            Todavía no hay cursos publicados.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => {
              const enrollment = enrolledMap.get(course.id);

              return (
                <div
                  key={course.id}
                  className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="flex h-28 items-center justify-center bg-gradient-to-br from-[#013C9A] to-[#3BB546] text-3xl font-bold text-white/90">
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
                    </div>

                    <p className="font-medium leading-snug">{course.title}</p>
                    <p className="line-clamp-2 text-xs text-slate-600">
                      {course.description}
                    </p>

                    <p className="text-xs text-slate-500">
                      {course.teacher.name} · {course._count.modules} semana(s)
                      {course.durationHrs ? ` · ${course.durationHrs} h` : ""}
                    </p>

                    <div className="mt-auto pt-3">
                      {enrollment ? (
                        <Link
                          href={`/alumno/cursos/${course.id}`}
                          className="block rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-center text-sm font-medium text-indigo-700 transition hover:bg-indigo-100"
                        >
                          {enrollment.progressPct > 0
                            ? `Continuar (${enrollment.progressPct}%)`
                            : "Empezar curso"}
                        </Link>
                      ) : (
                        <EnrollButton courseId={course.id} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
