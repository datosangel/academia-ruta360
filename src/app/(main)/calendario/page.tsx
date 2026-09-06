import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CalendarAddEvent } from "@/components/calendar-add-event";
import { CalendarEventChip } from "@/components/calendar-event-chip";

const DAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const START_HOUR = 7;
const END_HOUR = 22;

/** Lunes de la semana que contiene `date`, a las 00:00. */
function startOfWeek(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7; // lunes = 0
  d.setDate(d.getDate() - day);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

const rangeFmt = new Intl.DateTimeFormat("es", {
  day: "numeric",
  month: "long",
});

type Event = {
  id: string;
  title: string;
  subtitle: string;
  at: Date;
  kind: "CLASE" | "TAREA" | "EVENTO";
  href: string;
  canDelete?: boolean;
};

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ semana?: string }>;
}) {
  const session = await auth();
  const userId = session!.user.id;
  const role = session!.user.role;
  const { semana } = await searchParams;

  const offset = Number(semana ?? 0) || 0;
  const weekStart = addDays(startOfWeek(new Date()), offset * 7);
  const weekEnd = addDays(weekStart, 7);

  // Cursos relevantes: los del docente, o en los que el alumno está matriculado.
  const courseFilter =
    role === "DOCENTE"
      ? { teacherId: userId }
      : role === "ALUMNO"
        ? { enrollments: { some: { studentId: userId } } }
        : {};

  // Los eventos manuales generales (sin curso) solo los ve quien los creó;
  // los de un curso los ve cualquiera relacionado con ese curso.
  const [liveClasses, assignments, manualEvents, myCourses] = await Promise.all([
    prisma.liveClass.findMany({
      where: {
        scheduledAt: { gte: weekStart, lt: weekEnd },
        course: courseFilter,
      },
      include: { course: { select: { id: true, title: true } } },
    }),
    prisma.assignment.findMany({
      where: {
        dueDate: { gte: weekStart, lt: weekEnd },
        module: { course: courseFilter },
      },
      include: {
        module: { select: { course: { select: { id: true, title: true } } } },
      },
    }),
    prisma.calendarEvent.findMany({
      where: {
        date: { gte: weekStart, lt: weekEnd },
        OR: [{ authorId: userId }, { course: courseFilter }],
      },
      include: { course: { select: { id: true, title: true } } },
    }),
    role === "DOCENTE"
      ? prisma.course.findMany({ where: { teacherId: userId }, select: { id: true, title: true } })
      : Promise.resolve([]),
  ]);

  const courseBase =
    role === "DOCENTE" ? "/docente/cursos" : role === "ADMIN" ? "/admin/cursos" : "/alumno/cursos";

  const events: Event[] = [
    ...liveClasses.map((c) => ({
      id: c.id,
      title: c.title,
      subtitle: c.course.title,
      at: c.scheduledAt,
      kind: "CLASE" as const,
      href: c.joinUrl ?? `${courseBase}/${c.course.id}`,
    })),
    ...assignments.map((a) => ({
      id: a.id,
      title: `Entrega: ${a.title}`,
      subtitle: a.module.course.title,
      at: a.dueDate!,
      kind: "TAREA" as const,
      href: `${courseBase}/${a.module.course.id}`,
    })),
    ...manualEvents.map((ev) => ({
      id: ev.id,
      title: ev.title,
      subtitle: ev.course?.title ?? "General",
      at: ev.date,
      kind: "EVENTO" as const,
      href: ev.course ? `${courseBase}/${ev.course.id}` : "/calendario",
      canDelete: ev.authorId === userId,
    })),
  ];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const hours = Array.from(
    { length: END_HOUR - START_HOUR },
    (_, i) => START_HOUR + i
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Calendario académico</p>
          <h1 className="text-lg font-bold">
            Semana del {rangeFmt.format(weekStart)} al{" "}
            {rangeFmt.format(addDays(weekStart, 6))}
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          {(role === "DOCENTE" || role === "ADMIN") && (
            <CalendarAddEvent courses={myCourses} />
          )}
          <Link
            href="/calendario"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
          >
            Hoy
          </Link>
          <Link
            href={`/calendario?semana=${offset - 1}`}
            aria-label="Semana anterior"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white transition hover:bg-indigo-500"
          >
            ‹
          </Link>
          <Link
            href={`/calendario?semana=${offset + 1}`}
            aria-label="Semana siguiente"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white transition hover:bg-indigo-500"
          >
            ›
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="min-w-[820px]">
          {/* Cabecera de días */}
          <div className="grid grid-cols-[70px_repeat(7,1fr)] border-b border-slate-200">
            <div />
            {DAY_NAMES.map((name, i) => {
              const date = addDays(weekStart, i);
              const isToday = date.getTime() === today.getTime();

              return (
                <div
                  key={name}
                  className={`px-2 py-3 text-center text-sm ${
                    isToday ? "bg-indigo-50 font-semibold text-indigo-700" : ""
                  }`}
                >
                  {name}{" "}
                  <span
                    className={
                      isToday
                        ? "ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs text-white"
                        : "ml-1 text-slate-500"
                    }
                  >
                    {String(date.getDate()).padStart(2, "0")}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Rejilla horaria */}
          {hours.map((hour) => (
            <div
              key={hour}
              className="grid grid-cols-[70px_repeat(7,1fr)] border-b border-slate-100 last:border-b-0"
            >
              <div className="px-2 py-3 text-right text-xs text-slate-400">
                {String(hour).padStart(2, "0")}:00
              </div>

              {DAY_NAMES.map((_, dayIndex) => {
                const cellDate = addDays(weekStart, dayIndex);
                const isToday = cellDate.getTime() === today.getTime();

                const cellEvents = events.filter(
                  (e) =>
                    e.at.getDate() === cellDate.getDate() &&
                    e.at.getMonth() === cellDate.getMonth() &&
                    e.at.getHours() === hour
                );

                return (
                  <div
                    key={dayIndex}
                    className={`min-h-[52px] border-l border-slate-100 p-1 ${
                      isToday ? "bg-indigo-50/40" : ""
                    }`}
                  >
                    {cellEvents.map((e) => (
                      <CalendarEventChip
                        key={e.id}
                        id={e.id}
                        href={e.href}
                        title={e.title}
                        subtitle={e.subtitle}
                        canDelete={!!e.canDelete}
                        className={
                          e.kind === "CLASE"
                            ? "bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
                            : e.kind === "TAREA"
                              ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                              : "bg-violet-100 text-violet-800 hover:bg-violet-200"
                        }
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {events.length === 0 && (
        <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
          No hay clases ni entregas programadas esta semana. Aquí aparecerán las
          clases en vivo y las fechas límite de tus tareas.
        </p>
      )}

      <div className="flex gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-indigo-100" /> Clase en vivo
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-amber-100" /> Entrega de tarea
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-violet-100" /> Evento
        </span>
      </div>
    </div>
  );
}
