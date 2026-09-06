import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { loadCourseRoster } from "@/lib/roster";
import { CourseRoster } from "@/components/admin/course-roster";

export default async function DocenteRosterPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const session = await auth();
  const { courseId } = await params;

  const data = await loadCourseRoster(courseId);
  if (!data) notFound();
  if (data.teacherId !== session!.user.id) redirect("/docente/cursos");

  return (
    <CourseRoster
      courseTitle={data.courseTitle}
      students={data.students}
      backHref={`/docente/cursos/${courseId}`}
      chatBaseHref="/chat?con="
      historyBaseHref={`/docente/cursos/${courseId}/alumnos/`}
    />
  );
}
