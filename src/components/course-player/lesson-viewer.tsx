import { ProtectedVideoPlayer } from "@/components/course-player/protected-video-player";
import { ProtectedPdfViewer } from "@/components/course-player/protected-pdf-viewer";
import { MarkCompleteButton } from "@/components/course-player/mark-complete-button";

type Lesson = {
  id: string;
  title: string;
  type: string;
  contentUrl: string | null;
  body: string | null;
};

export function LessonViewer({
  lesson,
  completed,
  watermarkText,
}: {
  lesson: Lesson;
  completed: boolean;
  watermarkText: string;
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-8">
      <div>
        <h1 className="text-xl font-bold">{lesson.title}</h1>
      </div>

      {lesson.type === "VIDEO" && lesson.contentUrl && (
        <ProtectedVideoPlayer src={lesson.contentUrl} watermarkText={watermarkText} />
      )}

      {lesson.type === "PDF" && lesson.contentUrl && (
        <ProtectedPdfViewer src={lesson.contentUrl} watermarkText={watermarkText} />
      )}

      {lesson.type === "LINK_EXTERNO" && lesson.contentUrl && (
        <a
          href={lesson.contentUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Abrir enlace externo ↗
        </a>
      )}

      {lesson.body && (
        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
          {lesson.body}
        </p>
      )}

      <div className="border-t border-slate-200 pt-5">
        <MarkCompleteButton lessonId={lesson.id} initialCompleted={completed} />
      </div>
    </div>
  );
}
