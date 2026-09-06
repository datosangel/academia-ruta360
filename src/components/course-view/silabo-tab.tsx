import { formatDueDate } from "@/lib/format";

const LEVEL_LABEL: Record<string, string> = {
  BASICO: "Básico",
  INTERMEDIO: "Intermedio",
  AVANZADO: "Avanzado",
};

export function SilaboTab({
  description,
  level,
  durationHrs,
  categoryName,
  teacherName,
  teacherEmail,
  startDate,
  endDate,
  weekCount,
}: {
  description: string;
  level: string;
  durationHrs: number | null;
  categoryName: string | null;
  teacherName: string;
  teacherEmail: string;
  startDate: string | null;
  endDate: string | null;
  weekCount: number;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-[#0D212C]">Descripción del curso</h2>
        <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{description}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Nivel</p>
          <p className="mt-0.5 font-semibold">{LEVEL_LABEL[level] ?? level}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Duración</p>
          <p className="mt-0.5 font-semibold">
            {durationHrs ? `${durationHrs} horas` : "No especificada"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Categoría</p>
          <p className="mt-0.5 font-semibold">{categoryName ?? "General"}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Semanas</p>
          <p className="mt-0.5 font-semibold">{weekCount}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-[#0D212C]">Docente</h2>
        <p className="mt-1 text-sm text-slate-700">{teacherName}</p>
        <p className="text-sm text-slate-500">{teacherEmail}</p>
      </div>

      {(startDate || endDate) && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-[#0D212C]">Fechas del curso</h2>
          <p className="mt-1 text-sm text-slate-700">
            {startDate ? formatDueDate(startDate) : "Sin inicio definido"}
            {" — "}
            {endDate ? formatDueDate(endDate) : "Sin fin definido"}
          </p>
        </div>
      )}
    </div>
  );
}
