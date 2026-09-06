import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Reveal } from "@/components/landing/reveal";

const LEVEL_LABEL: Record<string, string> = {
  BASICO: "Nivel básico",
  INTERMEDIO: "Nivel intermedio",
  AVANZADO: "Nivel avanzado",
};

const FEATURE_BOXES = [
  {
    icon: "✅",
    title: "Plan de estudio",
    description: "Módulos organizados con videos, materiales y actividades a tu ritmo.",
    bg: "bg-sky-50",
  },
  {
    icon: "📊",
    title: "Seguimiento",
    description: "Tu avance se registra automáticamente en cada módulo y actividad.",
    bg: "bg-emerald-50",
  },
  {
    icon: "⏱️",
    title: "Acceso inmediato",
    description: "Ingresa cuando quieras, desde la computadora o el celular.",
    bg: "bg-amber-50",
  },
  {
    icon: "🎓",
    title: "Certificado",
    description: "Se emite automáticamente al completar el curso.",
    bg: "bg-rose-50",
  },
] as const;

const CATEGORY_STYLE: Record<string, { icon: string; gradient: string }> = {
  "Área común": { icon: "🩺", gradient: "from-[#013C9A] to-sky-500" },
  Evaluación: { icon: "📝", gradient: "from-amber-400 to-orange-500" },
  "Específico por profesión": {
    icon: "⚕️",
    gradient: "from-[#3BB546] to-emerald-600",
  },
};
const DEFAULT_CATEGORY_STYLE = { icon: "📘", gradient: "from-[#013C9A] to-[#3BB546]" };

export async function AvailableCourses() {
  const courses = await prisma.course.findMany({
    where: { status: "PUBLICADO" },
    include: { category: true, teacher: true },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  if (courses.length === 0) return null;

  return (
    <section id="cursos-disponibles" className="mx-auto max-w-[1000px] px-4 py-12 md:px-8">
      <Reveal>
        <h2 className="text-2xl font-semibold text-[#0D212C] md:text-3xl">
          Áreas de preparación
        </h2>
        <p className="mt-1 text-lg text-slate-600 md:text-xl">
          Cursos disponibles
        </p>
      </Reveal>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        {courses.map((course, i) => {
          const style = course.category
            ? (CATEGORY_STYLE[course.category.name] ?? DEFAULT_CATEGORY_STYLE)
            : DEFAULT_CATEGORY_STYLE;

          return (
            <Reveal key={course.id} delay={0.08 * (i % 6)} className="h-full">
              <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-[#013C9A]/30 hover:shadow-xl">
                {course.imageUrl ? (
                  <div className="relative h-48 w-full overflow-hidden">
                    <Image
                      src={course.imageUrl}
                      alt={course.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 500px"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div
                    className={`relative flex h-32 w-full items-center justify-center overflow-hidden bg-gradient-to-br ${style.gradient}`}
                  >
                    <span
                      aria-hidden
                      className="text-5xl transition duration-300 group-hover:scale-110 group-hover:rotate-3"
                    >
                      {style.icon}
                    </span>
                    <span className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-white/10" />
                    <span className="absolute -left-4 -top-4 h-16 w-16 rounded-full bg-white/10" />
                  </div>
                )}

                <div className="flex flex-1 flex-col p-5 md:p-6">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-lg font-semibold text-[#013C9A] underline-offset-2 hover:underline"
                  >
                    {course.title}
                    <span aria-hidden>🔓</span>
                  </Link>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 transition hover:bg-amber-100">
                      {LEVEL_LABEL[course.level] ?? course.level}
                    </span>
                    {course.durationHrs && (
                      <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 transition hover:bg-sky-100">
                        ⏱ {course.durationHrs} h
                      </span>
                    )}
                    {course.category && (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100">
                        {course.category.name}
                      </span>
                    )}
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-slate-600">
                    {course.description}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">Docente: {course.teacher.name}</p>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <Link
                      href="/login"
                      className="rounded-lg bg-[#013C9A] px-5 py-2.5 text-center text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-md hover:brightness-110 active:translate-y-0"
                    >
                      Ver curso
                    </Link>
                    <Link
                      href="/registro"
                      className="rounded-lg border border-[#3BB546] px-5 py-2.5 text-center text-sm font-semibold text-[#2E8C37] transition hover:-translate-y-0.5 hover:bg-[#3BB546]/10 hover:shadow-md active:translate-y-0"
                    >
                      Crear cuenta
                    </Link>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    Acceso web y móvil · tu avance se guarda solo
                  </p>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>

      {/* Beneficios de la plataforma: van una sola vez, no dentro de cada curso. */}
      <Reveal delay={0.1} className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURE_BOXES.map((box) => (
          <div
            key={box.title}
            className={`rounded-xl p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-sm ${box.bg}`}
          >
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <span aria-hidden>{box.icon}</span>
              {box.title}
            </p>
            <p className="mt-1 text-xs text-slate-600">{box.description}</p>
          </div>
        ))}
      </Reveal>
    </section>
  );
}
