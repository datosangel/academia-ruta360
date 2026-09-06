import { notFound } from "next/navigation";
import { loadAttemptForGrading } from "@/lib/attempt-data";
import { AttemptGrader } from "@/components/admin/attempt-grader";

export default async function AdminAttemptPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;

  const data = await loadAttemptForGrading(attemptId);
  if (!data) notFound();

  return (
    <AttemptGrader
      attemptId={data.attemptId}
      studentName={data.studentName}
      quizTitle={data.quizTitle}
      score={data.score}
      answers={data.answers}
      backHref={`/admin/evaluaciones/${data.quizId}`}
    />
  );
}
