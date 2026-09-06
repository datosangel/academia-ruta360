import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canManageCourse } from "@/lib/course-access";
import { notifyCourseStudents } from "@/lib/notifications";

const schema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(3, "El título es muy corto"),
  provider: z.enum(["ZOOM", "GOOGLE_MEET", "MS_TEAMS", "INTERNO"]),
  scheduledAt: z.string().min(1, "Indica fecha y hora"),
  durationMin: z.coerce.number().int().positive().default(60),
  joinUrl: z.string().url().optional().or(z.literal("")),
  // Para programar todo un semestre de una vez: repite la misma clase cada
  // semana, a la misma hora, la cantidad de veces indicada.
  weeks: z.coerce.number().int().min(1).max(32).default(1),
});

const dateTimeFmt = new Intl.DateTimeFormat("es", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

/** Programa una clase en vivo (o varias, si se repite semanalmente) y avisa a los alumnos. */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const { courseId, title, provider, scheduledAt, durationMin, joinUrl, weeks } =
    parsed.data;

  if (!(await canManageCourse(courseId))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { title: true },
  });

  const start = new Date(scheduledAt);
  const occurrences = Array.from({ length: weeks }, (_, i) => {
    const at = new Date(start);
    at.setDate(at.getDate() + i * 7);
    return at;
  });

  const created = await prisma.$transaction(
    occurrences.map((at, i) =>
      prisma.liveClass.create({
        data: {
          courseId,
          title: weeks > 1 ? `${title} — Semana ${i + 1}` : title,
          provider,
          scheduledAt: at,
          durationMin,
          joinUrl: joinUrl || null,
        },
      })
    )
  );

  const body =
    weeks > 1
      ? `${course?.title ?? ""}: "${title}" — ${weeks} sesiones semanales, la primera el ${dateTimeFmt.format(start)}`
      : `${course?.title ?? ""}: "${title}" el ${dateTimeFmt.format(start)}`;

  await notifyCourseStudents(courseId, {
    type: "CLASE",
    title: weeks > 1 ? "Nuevas clases en vivo programadas" : "Nueva clase en vivo",
    body,
    link: `/alumno/cursos/${courseId}?tab=zoom`,
  });

  return NextResponse.json({ ok: true, ids: created.map((c) => c.id), count: created.length });
}
