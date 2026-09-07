import { prisma } from "@/lib/prisma";

/**
 * Punto único para crear notificaciones. Cualquier acción relevante de la
 * plataforma (tarea calificada, entrega recibida, anuncio, mensaje) pasa por
 * aquí para que el usuario la vea en la campana.
 */
export async function notify(params: {
  userId: string;
  type: "ANUNCIO" | "TAREA" | "CALIFICACION" | "MENSAJE" | "CLASE";
  title: string;
  body: string;
  link?: string;
}) {
  await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      link: params.link ?? null,
    },
  });
}

/** Notifica a todos los alumnos matriculados en un curso. */
export async function notifyCourseStudents(
  courseId: string,
  params: Omit<Parameters<typeof notify>[0], "userId">
) {
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId },
    select: { studentId: true },
  });
  await Promise.all(
    enrollments.map((e) => notify({ ...params, userId: e.studentId }))
  );
}
