import { notFound } from "next/navigation";
import { loadAssignmentForGrading } from "@/lib/assignment-data";
import { AssignmentGrader } from "@/components/admin/assignment-grader";

export default async function AdminAssignmentPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = await params;

  const data = await loadAssignmentForGrading(assignmentId);
  if (!data) notFound();

  return (
    <AssignmentGrader
      assignment={data}
      students={data.students}
      backHref={`/admin/cursos/${data.courseId}`}
    />
  );
}
