import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CertificateSheet } from "@/components/certificate-sheet";

export default async function CertificadoPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const session = await auth();
  const { code } = await params;

  const certificate = await prisma.certificate.findUnique({
    where: { code },
    include: {
      student: { select: { id: true, name: true } },
      course: {
        select: {
          title: true,
          durationHrs: true,
          teacher: { select: { name: true } },
        },
      },
    },
  });

  // Cada alumno solo puede abrir sus propios certificados.
  if (!certificate || certificate.student.id !== session!.user.id) notFound();

  return (
    <CertificateSheet
      studentName={certificate.student.name}
      courseTitle={certificate.course.title}
      teacherName={certificate.course.teacher.name}
      durationHrs={certificate.course.durationHrs}
      issuedAt={certificate.issuedAt}
      code={certificate.code}
      backHref="/alumno/certificados"
    />
  );
}
