import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/** Video de ejemplo para las lecciones de demostración. */
const DEMO_VIDEO =
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

async function main() {
  const password = await bcrypt.hash("Password123!", 10);

  // Limpia las cuentas de demostración de la marca anterior. Se retira antes
  // lo que las referencia y no se borra en cascada, para no violar claves
  // foráneas. Así el seed se puede reejecutar sin resetear la base.
  const antiguos = await prisma.user.findMany({
    where: { email: { endsWith: "@aulavirtual.test" } },
    select: { id: true },
  });
  const antiguosIds = antiguos.map((u) => u.id);

  if (antiguosIds.length > 0) {
    await prisma.course.deleteMany({ where: { teacherId: { in: antiguosIds } } });
    await prisma.message.deleteMany({
      where: {
        OR: [
          { senderId: { in: antiguosIds } },
          { recipientId: { in: antiguosIds } },
        ],
      },
    });
    await prisma.forumPost.deleteMany({ where: { authorId: { in: antiguosIds } } });
    await prisma.announcement.deleteMany({
      where: { authorId: { in: antiguosIds } },
    });
    await prisma.submission.updateMany({
      where: { gradedById: { in: antiguosIds } },
      data: { gradedById: null },
    });
    await prisma.user.deleteMany({ where: { id: { in: antiguosIds } } });
  }

  const admin = await prisma.user.upsert({
    where: { email: "admin@ruta360.test" },
    update: {},
    create: {
      name: "Administrador Ruta 360",
      email: "admin@ruta360.test",
      passwordHash: password,
      role: "ADMIN",
    },
  });

  const docente = await prisma.user.upsert({
    where: { email: "docente@ruta360.test" },
    update: {},
    create: {
      name: "Dra. Ana Quispe",
      email: "docente@ruta360.test",
      passwordHash: password,
      role: "DOCENTE",
    },
  });

  const alumno = await prisma.user.upsert({
    where: { email: "alumno@ruta360.test" },
    update: {},
    create: {
      name: "Luis Barreda",
      email: "alumno@ruta360.test",
      passwordHash: password,
      role: "ALUMNO",
    },
  });

  const categoryNames = [
    "Área común",
    "Evaluación",
    "Específico por profesión",
  ];
  const categories: Record<string, string> = {};
  for (const name of categoryNames) {
    const c = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    categories[name] = c.id;
  }

  // Reinicia los cursos para que el seed se pueda volver a ejecutar limpio.
  await prisma.course.deleteMany({ where: { teacherId: docente.id } });

  // Curso principal, con contenido completo para la demostración.
  const course = await prisma.course.create({
    data: {
      title: "Salud Pública",
      description:
        "Determinantes de la salud, epidemiología, promoción y prevención, y programas nacionales, con el enfoque que exige el ENCAPS.",
      level: "BASICO",
      status: "PUBLICADO",
      durationHrs: 30,
      teacherId: docente.id,
      categoryId: categories["Área común"],
      modules: {
        create: [
          {
            title: "Fundamentos de Salud Pública",
            order: 1,
            lessons: {
              create: [
                {
                  title: "Bienvenida y cómo estudiar para el ENCAPS",
                  type: "VIDEO",
                  order: 1,
                  contentUrl: DEMO_VIDEO,
                  body: "Cómo está organizada tu preparación y qué esperar de cada área.",
                },
                {
                  title: "Determinantes sociales de la salud",
                  type: "VIDEO",
                  order: 2,
                  contentUrl: DEMO_VIDEO,
                  body: "Qué son, cómo se clasifican y cómo se preguntan en el examen.",
                },
                {
                  title: "Guía de conceptos clave (PDF)",
                  type: "PDF",
                  order: 3,
                  contentUrl:
                    "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                },
              ],
            },
          },
          {
            title: "Epidemiología aplicada",
            order: 2,
            lessons: {
              create: [
                {
                  title: "Medidas de frecuencia y asociación",
                  type: "VIDEO",
                  order: 1,
                  contentUrl: DEMO_VIDEO,
                  body: "Incidencia, prevalencia, riesgo relativo y odds ratio.",
                },
                {
                  title: "Caso práctico: brote comunitario",
                  type: "ACTIVIDAD",
                  order: 2,
                  body: "Analiza el caso y responde: ¿qué medida de frecuencia usarías y por qué?",
                },
              ],
            },
          },
          {
            title: "Programas nacionales de salud",
            order: 3,
            lessons: {
              create: [
                {
                  title: "Repaso final y siguientes pasos",
                  type: "VIDEO",
                  order: 1,
                  contentUrl: DEMO_VIDEO,
                  body: "Cierre del área y recomendaciones antes del simulacro.",
                },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.enrollment.create({
    data: { courseId: course.id, studentId: alumno.id },
  });

  // Resto de áreas del examen, publicadas para que el catálogo tenga contenido.
  const catalogo = [
    {
      title: "Gestión de Servicios de Salud",
      description:
        "Organización del sistema de salud, niveles de atención, referencia y contrarreferencia, y gestión de establecimientos.",
      category: "Área común",
      level: "INTERMEDIO" as const,
      durationHrs: 25,
      modules: [
        "El sistema de salud peruano",
        "Niveles de atención",
        "Gestión de establecimientos",
      ],
    },
    {
      title: "Cuidado Integral de la Salud",
      description:
        "Atención por etapas de vida, cuidado de la familia y la comunidad, y paquetes de atención integral.",
      category: "Área común",
      level: "INTERMEDIO" as const,
      durationHrs: 25,
      modules: ["Atención por etapas de vida", "Salud familiar y comunitaria"],
    },
    {
      title: "Investigación en Salud",
      description:
        "Diseños de estudio, lectura crítica de artículos y bases de bioestadística para el examen.",
      category: "Área común",
      level: "AVANZADO" as const,
      durationHrs: 20,
      modules: ["Diseños de investigación", "Lectura crítica y bioestadística"],
    },
    {
      title: "Ética e Interculturalidad",
      description:
        "Principios bioéticos, derechos del paciente y enfoque intercultural en la atención de salud.",
      category: "Área común",
      level: "BASICO" as const,
      durationHrs: 15,
      modules: ["Principios bioéticos", "Enfoque intercultural"],
    },
    {
      title: "Simulacros ENCAPS",
      description:
        "Simulacros cronometrados con el formato del examen y retroalimentación de cada pregunta.",
      category: "Evaluación",
      level: "AVANZADO" as const,
      durationHrs: 12,
      modules: ["Simulacro 1", "Simulacro 2", "Revisión de resultados"],
    },
  ];

  for (const c of catalogo) {
    await prisma.course.create({
      data: {
        title: c.title,
        description: c.description,
        level: c.level,
        status: "PUBLICADO",
        durationHrs: c.durationHrs,
        teacherId: docente.id,
        categoryId: categories[c.category],
        modules: {
          create: c.modules.map((title, i) => ({
            title,
            order: i + 1,
            lessons: {
              create: [
                {
                  title: `Introducción a ${title}`,
                  type: "VIDEO" as const,
                  order: 1,
                  contentUrl: DEMO_VIDEO,
                  body: `Primera lección del módulo "${title}".`,
                },
              ],
            },
          })),
        },
      },
    });
  }

  console.log({ admin: admin.email, docente: docente.email, alumno: alumno.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
