import { prisma } from "@/lib/prisma";
import { Reveal } from "@/components/landing/reveal";
import { CountUp } from "@/components/landing/count-up";

export async function StatsBar() {
  const [courseCount, categoryCount, moduleCount, hoursAgg] = await Promise.all([
    prisma.course.count({ where: { status: "PUBLICADO" } }),
    prisma.category.count(),
    prisma.module.count({ where: { course: { status: "PUBLICADO" } } }),
    prisma.course.aggregate({
      where: { status: "PUBLICADO" },
      _sum: { durationHrs: true },
    }),
  ]);

  const stats = [
    { value: courseCount, suffix: "", label: "Cursos disponibles" },
    { value: categoryCount, suffix: "", label: "Áreas de preparación" },
    { value: moduleCount, suffix: "", label: "Semanas de contenido" },
    { value: hoursAgg._sum.durationHrs ?? 0, suffix: "h", label: "De material" },
  ];

  return (
    <section className="relative mx-auto max-w-5xl px-6 py-10 md:py-14">
      <Reveal>
        <div className="grid grid-cols-2 gap-6 rounded-[28px] border border-slate-200 bg-white px-6 py-8 shadow-[0_4px_20px_rgba(1,60,154,0.06)] sm:grid-cols-4 sm:gap-4 sm:px-10">
          {stats.map((s, i) => (
            <div key={s.label} className={`text-center ${i % 2 === 1 ? "border-l border-slate-100 sm:border-l" : ""}`}>
              <p className="font-accent text-4xl font-semibold text-[#013C9A] md:text-5xl">
                <CountUp value={s.value} suffix={s.suffix} duration={1000 + i * 150} />
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500 md:text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
