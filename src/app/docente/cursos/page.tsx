import { auth } from "@/lib/auth";
import { loadCourseManagerData } from "@/lib/courses";
import { CourseManager } from "@/components/admin/course-manager";

export default async function DocenteCursosPage() {
  const session = await auth();
  const teacherId = session!.user.id;
  const { courses, teachers, categories } = await loadCourseManagerData(teacherId);

  return (
    <CourseManager
      courses={courses}
      teachers={teachers}
      categories={categories}
      canAssignTeacher={false}
      defaultTeacherId={teacherId}
      editorBasePath="/docente/cursos"
    />
  );
}
