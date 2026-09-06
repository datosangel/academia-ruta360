import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { canManageCourse } from "@/lib/course-access";

const schema = z.object({
  title: z.string().min(3, "El título es muy corto"),
  date: z.string().min(1, "Elige una fecha"),
  courseId: z.string().optional().or(z.literal("")),
});

/** El docente o el admin agregan un evento manual al calendario. */
export async function POST(req: Request) {
  const session = await requireRole("ADMIN", "DOCENTE");
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const { title, date, courseId } = parsed.data;

  if (courseId && !(await canManageCourse(courseId))) {
    return NextResponse.json({ error: "No autorizado para ese curso" }, { status: 401 });
  }

  const event = await prisma.calendarEvent.create({
    data: {
      title,
      date: new Date(date),
      courseId: courseId || null,
      authorId: session.user.id,
    },
  });

  return NextResponse.json({ ok: true, id: event.id });
}
