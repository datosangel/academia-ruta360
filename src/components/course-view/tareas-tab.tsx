import Link from "next/link";
import { formatDueDate } from "@/lib/format";

type Assignment = {
  id: string;
  title: string;
  dueDate: string | null;
  status: string;
  score: number | null;
  maxScore: number;
  weekNumber: number;
  weekTitle: string;
};

const STATUS_STYLE: Record<string, string> = {
  SIN_ENVIAR: "bg-slate-100 text-slate-500",
  BORRADOR: "bg-slate-100 text-slate-500",
  ENTREGADO: "bg-amber-100 text-amber-800",
  REQUIERE_CORRECCION: "bg-red-100 text-red-700",
  APROBADO: "bg-green-100 text-green-700",
};

const STATUS_LABEL: Record<string, string> = {
  SIN_ENVIAR: "Pendiente",
  BORRADOR: "Borrador",
  ENTREGADO: "En revisión",
  REQUIERE_CORRECCION: "Requiere corrección",
  APROBADO: "Aprobada",
};

export function TareasTab({ assignments }: { assignments: Assignment[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <ul className="divide-y divide-slate-100">
        {assignments.map((a) => (
          <li key={a.id}>
            <Link
              href={`/alumno/tareas/${a.id}`}
              className="flex items-center gap-3 px-5 py-4 text-sm transition hover:bg-slate-50"
            >
              <span className="text-lg leading-none">📝</span>
              <span className="flex-1">
                <span className="block font-medium">{a.title}</span>
                <span className="block text-xs text-slate-500">
                  Semana {a.weekNumber} · {a.weekTitle}
                  {a.dueDate && ` · Vence: ${formatDueDate(a.dueDate)}`}
                </span>
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLE[a.status]}`}
              >
                {a.status === "APROBADO"
                  ? `${a.score} / ${a.maxScore}`
                  : STATUS_LABEL[a.status]}
              </span>
            </Link>
          </li>
        ))}
        {assignments.length === 0 && (
          <li className="px-5 py-8 text-center text-sm text-slate-500">
            Este curso todavía no tiene tareas.
          </li>
        )}
      </ul>
    </div>
  );
}
