import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadCourseContent } from "@/lib/course-content";
import { ContentEditor } from "@/components/admin/content-editor";
import { ZoomTab } from "@/components/course-view/zoom-tab";
import { ForoTab } from "@/components/course-view/foro-tab";
import { splitLiveClasses } from "@/lib/live-classes";

export default async function DocenteCourseContentPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const session = await auth();
  const { courseId } = await params;
  const course = await loadCourseContent(courseId);
  if (!course) notFound();

  // Un docente solo edita el contenido de sus propios cursos.
  if (course.teacherId !== session!.user.id) redirect("/docente/cursos");

  const [liveClasses, posts] = await Promise.all([
    prisma.liveClass.findMany({ where: { courseId }, orderBy: { scheduledAt: "asc" } }),
    prisma.forumPost.findMany({
      where: { courseId, parentId: null },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { name: true } },
        replies: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { name: true } } },
        },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <ContentEditor
        courseId={course.id}
        courseTitle={course.title}
        modules={course.modules}
        announcements={course.announcements}
        backHref="/docente/cursos"
        quizBaseHref="/docente/evaluaciones"
        assignmentBaseHref="/docente/tareas"
      />

      <div>
        <h2 className="mb-3 text-lg font-bold">Clases en vivo</h2>
        {(() => {
          const { proximas, pasadas } = splitLiveClasses(liveClasses);
          const toPlain = (list: typeof liveClasses) =>
            list.map((c) => ({
              id: c.id,
              title: c.title,
              provider: c.provider,
              scheduledAt: c.scheduledAt.toISOString(),
              durationMin: c.durationMin,
              joinUrl: c.joinUrl,
              recordingUrl: c.recordingUrl,
            }));
          return (
            <ZoomTab
              courseId={courseId}
              canSchedule
              proximas={toPlain(proximas)}
              pasadas={toPlain(pasadas)}
            />
          );
        })()}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-bold">Foro del curso</h2>
        <ForoTab
          courseId={courseId}
          currentUserId={session!.user.id}
          posts={posts.map((p) => ({
            id: p.id,
            body: p.body,
            authorName: p.author.name,
            authorId: p.authorId,
            createdAt: p.createdAt.toISOString(),
            replies: p.replies.map((r) => ({
              id: r.id,
              body: r.body,
              authorName: r.author.name,
              authorId: r.authorId,
              createdAt: r.createdAt.toISOString(),
            })),
          }))}
        />
      </div>
    </div>
  );
}
