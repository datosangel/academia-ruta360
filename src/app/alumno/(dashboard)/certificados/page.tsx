import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncCertificates } from "@/lib/certificates";

const dateFmt = new Intl.DateTimeFormat("es", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export default async function CertificadosPage() {
  const session = await auth();
  const studentId = session!.user.id;

  // Cubre cursos completados antes de que existiera la emisión automática.
  await syncCertificates(studentId);

  const [certificates, inProgress] = await Promise.all([
    prisma.certificate.findMany({
      where: { studentId },
      orderBy: { issuedAt: "desc" },
      include: { course: { select: { title: true, durationHrs: true } } },
    }),
    prisma.enrollment.findMany({
      where: { studentId, progressPct: { lt: 100 } },
      orderBy: { progressPct: "desc" },
      include: { course: { select: { id: true, title: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Mis certificados</h1>
        <p className="text-sm text-slate-600">
          Se emiten automáticamente al completar el 100% de un curso.
        </p>
      </div>

      {certificates.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-4xl">🎓</p>
          <p className="mt-3 font-medium">Aún no tienes certificados</p>
          <p className="mt-1 text-sm text-slate-600">
            Completa todas las lecciones de un curso y tu certificado aparecerá
            aquí.
          </p>
          <Link
            href="/alumno"
            className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
          >
            Ver catálogo de cursos
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex h-24 items-center justify-center bg-gradient-to-br from-[#1b1030] via-[#221347] to-[#0d0a1f] text-3xl">
                🎓
              </div>
              <div className="space-y-2 p-4">
                <p className="font-medium leading-snug">{cert.course.title}</p>
                <p className="text-xs text-slate-500">
                  Emitido el {dateFmt.format(cert.issuedAt)}
                  {cert.course.durationHrs
                    ? ` · ${cert.course.durationHrs} horas`
                    : ""}
                </p>
                <p className="font-mono text-xs text-slate-500">
                  Código: {cert.code}
                </p>
                <Link
                  href={`/alumno/certificados/${cert.code}`}
                  className="mt-2 block rounded-lg bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-indigo-500"
                >
                  Ver y descargar
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {inProgress.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-semibold">En camino</h2>
          <ul className="divide-y divide-slate-100">
            {inProgress.map((e) => (
              <li key={e.id} className="flex items-center gap-4 py-3">
                <Link
                  href={`/alumno/cursos/${e.course.id}`}
                  className="flex-1 text-sm hover:text-indigo-600"
                >
                  {e.course.title}
                </Link>
                <div className="h-1.5 w-32 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-indigo-600"
                    style={{ width: `${e.progressPct}%` }}
                  />
                </div>
                <span className="w-10 text-right text-xs text-slate-500">
                  {e.progressPct}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
