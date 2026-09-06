import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDueDate } from "@/lib/format";

export default async function DocenteTareasPage() {
  const session = await auth();
  const teacherId = session!.user.id;

  const assignments = await prisma.assignment.findMany({
    where: { module: { course: { teacherId } } },
    orderBy: { createdAt: "desc" },
    include: {
      module: { select: { title: true, course: { select: { title: true } } } },
      submissions: { select: { status: true } },
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Tareas</h1>
        <p className="text-sm text-slate-600">
          Todas las tareas de tus cursos, con las entregas pendientes de revisar.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Tarea</th>
              <th className="px-4 py-3">Curso</th>
              <th className="px-4 py-3">Vence</th>
              <th className="px-4 py-3">Entregas</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {assignments.map((a) => {
              const pendientes = a.submissions.filter(
                (s) => s.status === "ENTREGADO"
              ).length;

              return (
                <tr key={a.id}>
                  <td className="px-4 py-3 font-medium">{a.title}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {a.module.course.title} · {a.module.title}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {a.dueDate ? formatDueDate(a.dueDate) : "Sin fecha"}
                  </td>
                  <td className="px-4 py-3">
                    {pendientes > 0 ? (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                        {pendientes} por revisar
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Al día</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/docente/tareas/${a.id}`}
                      className="rounded border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50"
                    >
                      Ver entregas
                    </Link>
                  </td>
                </tr>
              );
            })}
            {assignments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  Todavía no has creado ninguna tarea. Ve a un curso →
                  Contenidos → un módulo → «Añadir tarea».
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
