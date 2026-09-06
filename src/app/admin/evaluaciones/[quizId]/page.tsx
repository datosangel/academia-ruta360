import { notFound } from "next/navigation";
import { loadQuizForEditor } from "@/lib/quiz-data";
import { QuizEditor } from "@/components/admin/quiz-editor";

export default async function AdminQuizPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = await params;

  const data = await loadQuizForEditor(quizId);
  if (!data) notFound();

  return (
    <QuizEditor
      quiz={data.quiz}
      questions={data.questions}
      attempts={data.attempts}
      backHref={`/admin/cursos/${data.courseId}`}
      gradeBaseHref="/admin/intentos"
    />
  );
}
