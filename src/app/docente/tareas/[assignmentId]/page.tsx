import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { loadAssignmentForGrading } from "@/lib/assignment-data";
import { AssignmentGrader } from "@/components/admin/assignment-grader";

export default async function DocenteAssignmentPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const session = await auth();
  const { assignmentId } = await params;

  const data = await loadAssignmentForGrading(assignmentId);
  if (!data) notFound();
  if (data.teacherId !== session!.user.id) redirect("/docente/tareas");

  return (
    <AssignmentGrader
      assignment={data}
      students={data.students}
      backHref={`/docente/cursos/${data.courseId}`}
    />
  );
}
