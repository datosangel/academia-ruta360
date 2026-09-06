"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function MarkCompleteButton({
  lessonId,
  initialCompleted,
}: {
  lessonId: string;
  initialCompleted: boolean;
}) {
  const router = useRouter();
  const [completed, setCompleted] = useState(initialCompleted);
  const [isPending, startTransition] = useTransition();

  const handleClick = async () => {
    const res = await fetch(`/api/lessons/${lessonId}/complete`, {
      method: "POST",
    });
    if (!res.ok) return;
    const data = await res.json();
    setCompleted(data.completed);
    startTransition(() => router.refresh());
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-60 ${
        completed
          ? "bg-green-100 text-green-700 hover:bg-green-200"
          : "bg-indigo-600 text-white hover:bg-indigo-500"
      }`}
    >
      {completed ? "✓ Lección completada" : "Marcar como completada"}
    </button>
  );
}
