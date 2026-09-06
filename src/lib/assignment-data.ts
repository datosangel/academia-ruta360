import { prisma } from "@/lib/prisma";

/** Carga una tarea con las entregas de todos los alumnos matriculados. */
export async function loadAssignmentForGrading(assignmentId: string) {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      module: {
        select: {
          title: true,
          courseId: true,
          course: {
            select: {
              title: true,
              teacherId: true,
              enrollments: {
                select: { student: { select: { id: true, name: true, email: true } } },
              },
            },
          },
        },
      },
      submissions: true,
    },
  });
  if (!assignment) return null;

  const byStudent = new Map(assignment.submissions.map((s) => [s.studentId, s]));

  return {
    id: assignment.id,
    title: assignment.title,
    description: assignment.description,
    attachmentUrl: assignment.attachmentUrl,
    dueDate: assignment.dueDate?.toISOString() ?? null,
    maxScore: assignment.maxScore,
    courseId: assignment.module.courseId,
    courseTitle: assignment.module.course.title,
    moduleTitle: assignment.module.title,
    teacherId: assignment.module.course.teacherId,
    // Un alumno matriculado sin entregar aparece igual, con estado pendiente.
    students: assignment.module.course.enrollments.map(({ student }) => {
      // Un borrador es privado del alumno: para el docente es como si no
      // hubiera entregado nada todavía.
      const raw = byStudent.get(student.id);
      const s = raw && raw.status !== "BORRADOR" ? raw : null;
      return {
        submissionId: s?.id ?? null,
        studentId: student.id,
        studentName: student.name,
        studentEmail: student.email,
        fileUrl: s?.fileUrl ?? null,
        comment: s?.comment ?? null,
        status: s?.status ?? "SIN_ENVIAR",
        score: s?.score ?? null,
        feedback: s?.feedback ?? null,
        submittedAt: s?.submittedAt?.toISOString() ?? null,
      };
    }),
  };
}
