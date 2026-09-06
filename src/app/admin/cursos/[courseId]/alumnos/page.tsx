import { notFound } from "next/navigation";
import { loadCourseRoster } from "@/lib/roster";
import { CourseRoster } from "@/components/admin/course-roster";

export default async function AdminRosterPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  const data = await loadCourseRoster(courseId);
  if (!data) notFound();

  return (
    <CourseRoster
      courseTitle={data.courseTitle}
      students={data.students}
      backHref={`/admin/cursos/${courseId}`}
      chatBaseHref="/chat?con="
      historyBaseHref={`/admin/cursos/${courseId}/alumnos/`}
    />
  );
}
