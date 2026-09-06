import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CertificateSheet } from "@/components/certificate-sheet";

/**
 * Página pública: cualquiera con el código puede comprobar que un certificado
 * es auténtico. No requiere iniciar sesión.
 */
export default async function ValidarPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const certificate = await prisma.certificate.findUnique({
    where: { code },
    include: {
      student: { select: { name: true } },
      course: {
        select: {
          title: true,
          durationHrs: true,
          teacher: { select: { name: true } },
        },
      },
    },
  });

  if (!certificate) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-md text-center">
          <p className="text-4xl">⚠️</p>
          <h1 className="mt-4 text-xl font-bold">Certificado no encontrado</h1>
          <p className="mt-2 text-sm text-slate-600">
            No existe ningún certificado con el código{" "}
            <span className="font-mono">{code}</span>. Revisa que esté bien
            escrito.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
          >
            Ir al inicio
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div>
      <div className="bg-green-50 px-6 py-3 text-center text-sm text-green-800 print:hidden">
        ✓ Certificado auténtico, emitido por Academia Ruta 360.
      </div>
      <CertificateSheet
        studentName={certificate.student.name}
        courseTitle={certificate.course.title}
        teacherName={certificate.course.teacher.name}
        durationHrs={certificate.course.durationHrs}
        issuedAt={certificate.issuedAt}
        code={certificate.code}
      />
    </div>
  );
}
