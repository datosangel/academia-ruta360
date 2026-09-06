import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { loadQuizForEditor } from "@/lib/quiz-data";
import { QuizEditor } from "@/components/admin/quiz-editor";

export default async function DocenteQuizPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const session = await auth();
  const { quizId } = await params;

  const data = await loadQuizForEditor(quizId);
  if (!data) notFound();

  // Un docente solo edita las evaluaciones de sus propios cursos.
  if (data.teacherId !== session!.user.id) redirect("/docente/cursos");

  return (
    <QuizEditor
      quiz={data.quiz}
      questions={data.questions}
      attempts={data.attempts}
      backHref={`/docente/cursos/${data.courseId}`}
      gradeBaseHref="/docente/intentos"
    />
  );
}
