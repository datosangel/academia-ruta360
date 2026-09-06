import { auth } from "@/lib/auth";
import { loadCourseManagerData } from "@/lib/courses";
import { CourseManager } from "@/components/admin/course-manager";

const VALID_STATUSES = ["BORRADOR", "PUBLICADO", "FINALIZADO", "ARCHIVADO"];

export default async function AdminCursosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const session = await auth();
  const { estado } = await searchParams;
  const { courses, teachers, categories } = await loadCourseManagerData();

  return (
    <CourseManager
      courses={courses}
      teachers={teachers}
      categories={categories}
      canAssignTeacher
      defaultTeacherId={session!.user.id}
      editorBasePath="/admin/cursos"
      initialStatus={estado && VALID_STATUSES.includes(estado) ? estado : null}
    />
  );
}
