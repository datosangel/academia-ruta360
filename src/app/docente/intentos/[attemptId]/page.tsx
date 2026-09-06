import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { loadAttemptForGrading } from "@/lib/attempt-data";
import { AttemptGrader } from "@/components/admin/attempt-grader";

export default async function DocenteAttemptPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const session = await auth();
  const { attemptId } = await params;

  const data = await loadAttemptForGrading(attemptId);
  if (!data) notFound();

  // Un docente solo califica intentos de sus propios cursos.
  if (data.teacherId !== session!.user.id) redirect("/docente/cursos");

  return (
    <AttemptGrader
      attemptId={data.attemptId}
      studentName={data.studentName}
      quizTitle={data.quizTitle}
      score={data.score}
      answers={data.answers}
      backHref={`/docente/evaluaciones/${data.quizId}`}
    />
  );
}
