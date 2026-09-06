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
    <section id="areas" className="mx-auto max-w-[1200px] px-6 py-12">
      <div className="flex flex-col gap-16 md:gap-20">
        {FEATURED.map((course, i) => (
          <Reveal key={course.title} delay={0.1 * (i + 1)}>
            <div className="ml-20 md:ml-28">
              <h3 className="font-accent text-2xl font-semibold text-[#013C9A] md:text-3xl">
                {course.title}
              </h3>
              <p className="mt-1 text-sm text-[#051A24]/70 md:text-base">
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
