import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function PortafolioPage() {
  const session = await auth();
  const studentId = session!.user.id;

  const [cursosCompletados, trabajosAprobados] = await Promise.all([
    prisma.enrollment.findMany({
      where: { studentId, progressPct: 100 },
      include: { course: { select: { id: true, title: true } } },
      orderBy: { completedAt: "desc" },
    }),
    prisma.submission.findMany({
      where: { studentId, status: "APROBADO" },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            maxScore: true,
            module: { select: { course: { select: { id: true, title: true } } } },
          },
        },
      },
      orderBy: { gradedAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Mi Portafolio</h1>
        <p className="text-sm text-slate-600">
          Los cursos que completaste y los trabajos que el docente aprobó — útil
          para mostrar tu progreso más allá de una nota.
        </p>
      </div>

      <div>
        <h2 className="mb-3 font-semibold">Cursos completados</h2>
        {cursosCompletados.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
            Todavía no completaste ningún curso al 100%.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cursosCompletados.map((e) => (
              <li
                key={e.courseId}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <p className="text-lg leading-none">✔</p>
                <Link
                  href={`/alumno/cursos/${e.course.id}`}
                  className="mt-2 block text-sm font-medium text-slate-800 hover:text-indigo-600"
                >
                  {e.course.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="mb-3 font-semibold">Proyectos y trabajos aprobados</h2>
        {trabajosAprobados.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
            Todavía no tienes trabajos aprobados por un docente.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {trabajosAprobados.map((s) => (
              <li
                key={s.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <p className="text-lg leading-none">📊</p>
                <Link
                  href={`/alumno/tareas/${s.assignment.id}`}
                  className="mt-2 block text-sm font-medium text-slate-800 hover:text-indigo-600"
                >
                  {s.assignment.title}
                </Link>
                <p className="mt-1 text-xs text-slate-500">
                  {s.assignment.module.course.title} · {s.score} / {s.assignment.maxScore}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
