import { prisma } from "@/lib/prisma";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin caracteres ambiguos

/** Nota mínima aprobatoria de una evaluación, sobre 20. */
const PASSING_SCORE = 11;

/** Genera un código legible del tipo AV-7K3M-9QX2. */
function generateCode() {
  const block = (n: number) =>
    Array.from(
      { length: n },
      () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
    ).join("");
  return `AV-${block(4)}-${block(4)}`;
}

/**
 * Emite el certificado de un curso terminado. Es idempotente: si el alumno ya
 * tiene uno para ese curso, lo devuelve sin crear otro.
 */
export async function issueCertificate(courseId: string, studentId: string) {
  const existing = await prisma.certificate.findUnique({
    where: { courseId_studentId: { courseId, studentId } },
  });
  if (existing) return existing;

  // Reintenta si el código sorteado ya existiera.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    const clash = await prisma.certificate.findUnique({ where: { code } });
    if (clash) continue;

    return prisma.certificate.create({
      data: { courseId, studentId, code },
    });
  }

  throw new Error("No se pudo generar un código de certificado único");
}

/**
 * Revisa si un alumno cumple TODO lo que ahora exige el certificado:
 * curso completado + evaluaciones aprobadas + trabajos entregados y
 * aprobados (el "proyecto final" es, en la práctica, la última tarea del
 * curso: al exigir que TODAS las tareas estén aprobadas queda cubierta sin
 * necesitar una marca aparte en el modelo de datos).
 */
export async function meetsCertificateRequirements(
  courseId: string,
  studentId: string
) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { courseId_studentId: { courseId, studentId } },
  });
  if (!enrollment || enrollment.progressPct < 100) return false;

  const [quizzes, assignments] = await Promise.all([
    prisma.quiz.findMany({
      where: { module: { courseId } },
      include: {
        attempts: {
          where: { studentId, submittedAt: { not: null } },
          select: { score: true },
        },
      },
    }),
    prisma.assignment.findMany({
      where: { module: { courseId } },
      include: {
        submissions: { where: { studentId }, select: { status: true } },
      },
    }),
  ]);

  const evaluacionesAprobadas = quizzes.every((q) => {
    const mejor = q.attempts.reduce(
      (max, a) => Math.max(max, a.score ?? 0),
      -Infinity
    );
    return mejor >= PASSING_SCORE;
  });

  const trabajosAprobados = assignments.every(
    (a) => a.submissions[0]?.status === "APROBADO"
  );

  return evaluacionesAprobadas && trabajosAprobados;
}

/** Emite el certificado solo si ya se cumplen todos los requisitos. */
export async function checkAndIssueCertificate(
  courseId: string,
  studentId: string
) {
  if (await meetsCertificateRequirements(courseId, studentId)) {
    await issueCertificate(courseId, studentId);
  }
}

/**
 * Emite los certificados que falten para todos los cursos que el alumno ya
 * completó. Cubre matrículas terminadas antes de que existiera esta función.
 */
export async function syncCertificates(studentId: string) {
  const completed = await prisma.enrollment.findMany({
    where: { studentId, progressPct: 100 },
    select: { courseId: true },
  });

  for (const { courseId } of completed) {
    await checkAndIssueCertificate(courseId, studentId);
  }
}
