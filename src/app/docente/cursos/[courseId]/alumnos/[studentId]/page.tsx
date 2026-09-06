import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { loadStudentHistory } from "@/lib/student-history";
import { StudentHistory } from "@/components/admin/student-history";

export default async function DocenteStudentHistoryPage({
  params,
}: {
  params: Promise<{ courseId: string; studentId: string }>;
}) {
  const session = await auth();
  const { courseId, studentId } = await params;

  const data = await loadStudentHistory(courseId, studentId);
  if (!data) notFound();
  if (data.teacherId !== session!.user.id) redirect("/docente/cursos");

  return <StudentHistory data={data} backHref={`/docente/cursos/${courseId}/alumnos`} />;
}
