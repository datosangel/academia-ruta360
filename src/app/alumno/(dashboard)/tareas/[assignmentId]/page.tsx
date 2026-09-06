import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubmissionForm } from "@/components/submission-form";
import { formatDueDate } from "@/lib/format";

export default async function AlumnoTareaPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const session = await auth();
  const studentId = session!.user.id;
  const { assignmentId } = await params;

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      module: {
        select: { title: true, courseId: true, course: { select: { title: true } } },
      },
    },
  });
  if (!assignment) notFound();

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      courseId_studentId: { courseId: assignment.module.courseId, studentId },
    },
  });
  if (!enrollment) redirect("/alumno");

  const submission = await prisma.submission.findUnique({
    where: { assignmentId_studentId: { assignmentId, studentId } },
  });

  const vencida = assignment.dueDate ? new Date() > assignment.dueDate : false;

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-6">
      <div>
        <Link
          href={`/alumno/cursos/${assignment.module.courseId}`}
          className="text-xs font-medium text-slate-500 hover:text-indigo-600"
        >
          ← Volver al curso
        </Link>
        <h1 className="mt-2 text-xl font-bold">{assignment.title}</h1>
        <p className="text-sm text-slate-600">
          {assignment.module.course.title} · {assignment.module.title} · sobre{" "}
          {assignment.maxScore} puntos
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="whitespace-pre-line text-sm text-slate-700">
          {assignment.description}
        </p>
        {assignment.attachmentUrl && (
          <a
            href={assignment.attachmentUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block text-sm text-indigo-600 underline"
          >
            Material adjunto de la tarea ↗
          </a>
        )}
        {assignment.dueDate && (
          <p
            className={`mt-3 text-xs font-medium ${vencida ? "text-red-600" : "text-slate-500"}`}
          >
            {vencida ? "Venció el " : "Fecha límite: "}
            {formatDueDate(assignment.dueDate)}
          </p>
        )}
      </div>

      {submission?.status === "APROBADO" ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-5">
          <p className="text-sm font-medium text-green-800">
            ✓ Aprobada — Nota: {submission.score} / {assignment.maxScore}
          </p>
          {submission.feedback && (
            <p className="mt-2 whitespace-pre-line text-sm text-green-900">
              {submission.feedback}
            </p>
          )}
        </div>
      ) : (
        <>
          {submission?.status === "REQUIERE_CORRECCION" && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5">
              <p className="text-sm font-medium text-red-800">
                El docente pidió corregir esta entrega:
              </p>
              {submission.feedback && (
                <p className="mt-2 whitespace-pre-line text-sm text-red-900">
                  {submission.feedback}
                </p>
              )}
            </div>
          )}
          <SubmissionForm
            assignmentId={assignment.id}
            initialFileUrl={submission?.fileUrl ?? ""}
            initialComment={submission?.comment ?? ""}
            status={submission?.status ?? "SIN_ENVIAR"}
          />
        </>
      )}
    </div>
  );
}
