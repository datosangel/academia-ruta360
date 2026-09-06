import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadCourseForStudent } from "@/lib/course-view";
import { CourseTabBar, type TabKey } from "@/components/course-view/course-tab-bar";
import { WeekAccordion } from "@/components/course-view/week-accordion";
import { SilaboTab } from "@/components/course-view/silabo-tab";
import { EvaluacionesTab } from "@/components/course-view/evaluaciones-tab";
import { TareasTab } from "@/components/course-view/tareas-tab";
import { NotasTab } from "@/components/course-view/notas-tab";
import { ForoTab } from "@/components/course-view/foro-tab";
import { ZoomTab } from "@/components/course-view/zoom-tab";
import { splitLiveClasses } from "@/lib/live-classes";
import { AnnouncementPanel } from "@/components/announcement-panel";
import { CourseSidebar } from "@/components/course-player/course-sidebar";
import { LessonViewer } from "@/components/course-player/lesson-viewer";

const VALID_TABS: TabKey[] = [
  "silabo",
  "contenido",
  "evaluaciones",
  "tareas",
  "foros",
  "notas",
  "anuncios",
  "zoom",
];

export default async function CoursePlayerPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ leccion?: string; tab?: string }>;
}) {
  const session = await auth();
  const studentId = session!.user.id;
  const { courseId } = await params;
  const { leccion, tab: rawTab } = await searchParams;

  const enrollment = await prisma.enrollment.findUnique({
    where: { courseId_studentId: { courseId, studentId } },
  });
  if (!enrollment) redirect("/alumno");

  const course = await loadCourseForStudent(courseId, studentId);
  if (!course) notFound();

  const tab: TabKey = VALID_TABS.includes(rawTab as TabKey)
    ? (rawTab as TabKey)
    : "contenido";

  // El visor de una lección puntual reemplaza el acordeón, sin salir de la
  // pestaña «Contenido», para conservar la protección del reproductor.
  if (tab === "contenido" && leccion) {
    const allLessons = course.weeks.flatMap((w) => w.lessons);
    const activeLesson = allLessons.find((l) => l.id === leccion);
    if (!activeLesson) notFound();

    const lessonFull = await prisma.lesson.findUnique({ where: { id: leccion } });
    if (!lessonFull) notFound();

    return (
      <div className="min-h-screen bg-white">
        <div className="border-b border-slate-200 px-4 py-3 sm:px-8">
          <p className="text-sm font-semibold text-[#0D212C]">{course.title}</p>
        </div>
        <CourseTabBar baseHref={`/alumno/cursos/${courseId}`} active="contenido" />
        <div className="flex flex-col sm:flex-row">
          <CourseSidebar
            courseId={courseId}
            modules={course.weeks.map((w) => ({
              id: w.id,
              title: w.title,
              lessons: w.lessons,
              quizzes: w.quizzes,
              assignments: w.assignments,
            }))}
            activeLessonId={activeLesson.id}
            progressPct={enrollment.progressPct}
          />
          <main className="flex-1 bg-slate-50">
            <LessonViewer
              lesson={lessonFull}
              completed={activeLesson.completed}
              watermarkText={`${session!.user.name} · ${session!.user.email}`}
            />
          </main>
        </div>
      </div>
    );
  }

  const [posts, liveClasses] = await Promise.all([
    tab === "foros"
      ? prisma.forumPost.findMany({
          where: { courseId, parentId: null },
          orderBy: { createdAt: "desc" },
          include: {
            author: { select: { name: true } },
            replies: {
              orderBy: { createdAt: "asc" },
              include: { author: { select: { name: true } } },
            },
          },
        })
      : Promise.resolve([]),
    tab === "zoom"
      ? prisma.liveClass.findMany({ where: { courseId }, orderBy: { scheduledAt: "asc" } })
      : Promise.resolve([]),
  ]);

  const announcements =
    tab === "anuncios"
      ? await prisma.announcement.findMany({
          where: { courseId },
          orderBy: { createdAt: "desc" },
          include: { author: { select: { name: true } } },
        })
      : [];

  return (
    <div className="min-h-screen bg-[#f4f7fc]">
      <div className="border-b border-slate-200 bg-white px-4 py-3 sm:px-8">
        <p className="text-sm font-semibold text-[#0D212C]">{course.title}</p>
      </div>
      <CourseTabBar baseHref={`/alumno/cursos/${courseId}`} active={tab} />

      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-8">
        {tab === "silabo" && (
          <SilaboTab
            description={course.description}
            level={course.level}
            durationHrs={course.durationHrs}
            categoryName={course.categoryName}
            teacherName={course.teacherName}
            teacherEmail={course.teacherEmail}
            startDate={course.startDate}
            endDate={course.endDate}
            weekCount={course.weeks.length}
          />
        )}

        {tab === "contenido" && (
          <WeekAccordion weeks={course.weeks} courseId={courseId} />
        )}

        {tab === "evaluaciones" && <EvaluacionesTab quizzes={course.allQuizzes} />}

        {tab === "tareas" && <TareasTab assignments={course.allAssignments} />}

        {tab === "notas" && (
          <NotasTab quizzes={course.allQuizzes} assignments={course.allAssignments} />
        )}

        {tab === "foros" && (
          <ForoTab
            courseId={courseId}
            currentUserId={studentId}
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
        )}

        {tab === "anuncios" && (
          <AnnouncementPanel
            courseId={courseId}
            canPost={false}
            announcements={announcements.map((a) => ({
              id: a.id,
              title: a.title,
              body: a.body,
              authorName: a.author.name,
              createdAt: a.createdAt.toISOString(),
            }))}
          />
        )}

        {tab === "zoom" &&
          (() => {
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
                canSchedule={false}
                proximas={toPlain(proximas)}
                pasadas={toPlain(pasadas)}
              />
            );
          })()}
      </div>
    </div>
  );
}
