"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function CalendarEventChip({
  id,
  href,
  title,
  subtitle,
  className,
  canDelete,
}: {
  id: string;
  href: string;
  title: string;
  subtitle: string;
  className: string;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const eliminar = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("¿Eliminar este evento?")) return;
    await fetch(`/api/calendar-events/${id}`, { method: "DELETE" });
    startTransition(() => router.refresh());
  };

  return (
    <Link href={href} className={`group relative mb-1 block rounded-md px-2 py-1 text-[11px] leading-tight transition ${className}`}>
      <span className="block truncate pr-3 font-medium">{title}</span>
      <span className="block truncate opacity-70">{subtitle}</span>
      {canDelete && (
        <button
          onClick={eliminar}
          aria-label="Eliminar evento"
          className="absolute right-0.5 top-0.5 hidden h-3.5 w-3.5 items-center justify-center rounded-full bg-black/10 text-[9px] leading-none hover:bg-black/20 group-hover:flex"
        >
          ×
        </button>
      )}
    </Link>
  );
}
