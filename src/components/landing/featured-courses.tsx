import Image from "next/image";
import { Reveal } from "@/components/landing/reveal";
import { unsplashUrl } from "@/components/landing/course-tiles";

const FEATURED = [
  {
    title: "Salud Pública",
    description:
      "Determinantes, epidemiología y programas nacionales, con el enfoque que exige el examen.",
    photoId: "photo-1631815590058-860e4f83c1e8",
    alt: "Trabajadora de salud atendiendo en la comunidad",
  },
  {
    title: "Gestión de Servicios de Salud",
    description:
      "Organización del sistema, niveles de atención y gestión de establecimientos.",
    photoId: "photo-1516841273335-e39b37888115",
    alt: "Equipo médico en un pasillo de hospital",
  },
  {
    title: "Cuidado Integral e Investigación",
    description:
      "Atención por etapas de vida, ética, interculturalidad y bases de investigación.",
    photoId: "photo-1584432810601-6c7f27d2362b",
    alt: "Profesional de salud con estetoscopio",
  },
];

export function FeaturedCourses() {
  return (
    <section id="areas" className="mx-auto max-w-[1200px] px-5 py-16 md:px-8 md:py-20">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#3BB546]">
          Áreas del examen
        </p>
        <h2 className="mt-2 max-w-2xl text-[30px] font-extrabold leading-[1.1] tracking-tight text-[#0D212C] md:text-[40px]">
          Lo que vas a dominar antes de rendir
        </h2>
      </Reveal>

      <div className="mt-12 flex flex-col gap-16 md:gap-20">
        {FEATURED.map((course, i) => (
          <Reveal key={course.title} delay={0.1 * (i + 1)}>
            <div>
              <h3 className="text-2xl font-bold text-[#013C9A] md:text-3xl">
                {course.title}
              </h3>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
                {course.description}
              </p>
            </div>

            <div className="relative mt-6 h-56 w-full overflow-hidden rounded-2xl shadow-lg md:h-80">
              <Image
                src={unsplashUrl(course.photoId, 1400, 700)}
                alt={course.alt}
                fill
                sizes="(max-width: 768px) 100vw, 1200px"
                className="object-cover"
              />
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
