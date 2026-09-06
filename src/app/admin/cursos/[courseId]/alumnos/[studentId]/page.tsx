import { notFound } from "next/navigation";
import { loadStudentHistory } from "@/lib/student-history";
import { StudentHistory } from "@/components/admin/student-history";

export default async function AdminStudentHistoryPage({
  params,
}: {
  params: Promise<{ courseId: string; studentId: string }>;
}) {
  const { courseId, studentId } = await params;

  const data = await loadStudentHistory(courseId, studentId);
  if (!data) notFound();

  return <StudentHistory data={data} backHref={`/admin/cursos/${courseId}/alumnos`} />;
}
