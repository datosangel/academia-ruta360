import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/stat-card";

export default async function AdminDashboard() {
  const [students, activeCourses, finishedCourses, teachers] =
    await Promise.all([
      prisma.user.count({ where: { role: "ALUMNO" } }),
      prisma.course.count({ where: { status: "PUBLICADO" } }),
      prisma.course.count({ where: { status: "FINALIZADO" } }),
      prisma.user.count({ where: { role: "DOCENTE" } }),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Panel de administración</h1>
        <p className="text-sm text-slate-600">
          Resumen general de la plataforma
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Estudiantes" value={students} href="/admin/usuarios?rol=ALUMNO" />
        <StatCard label="Docentes" value={teachers} href="/admin/usuarios?rol=DOCENTE" />
        <StatCard
          label="Cursos activos"
          value={activeCourses}
          href="/admin/cursos?estado=PUBLICADO"
        />
        <StatCard
          label="Cursos finalizados"
          value={finishedCourses}
          href="/admin/cursos?estado=FINALIZADO"
        />
      </div>
    </div>
  );
}
