import { LandingButton } from "@/components/landing/landing-button";
import { Reveal } from "@/components/landing/reveal";

const MISION = [
  "Enseñanza de calidad",
  "Aprendizaje práctico",
  "Evaluación continua",
  "Acompañamiento personalizado",
  "Mejora constante",
];

const VISION = [
  "Excelencia académica",
  "Innovación en la enseñanza",
  "Formación de profesionales de la salud",
  "Resultados y progreso medible",
  "Compromiso con la salud del país",
];

function Check({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className="mt-0.5 h-4 w-4 shrink-0"
      fill="none"
      stroke={color}
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m4 10.5 4 4 8-9" />
    </svg>
  );
}

export function PlansSection() {
  return (
    <section id="nosotros" className="w-full px-6 py-12">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
        <Reveal
          delay={0.1}
          className="rounded-[32px] bg-[#013C9A] px-8 py-9 text-white shadow-[0_10px_30px_rgba(1,60,154,0.18)]"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
            Misión
          </p>
          <p className="mt-3 text-lg leading-relaxed">
            Brindar una preparación integral, práctica y estratégica a los
            profesionales de la salud que se preparan para el ENCAPS–SERUMS,
            fortaleciendo sus conocimientos y habilidades.
          </p>
          <ul className="mt-6 space-y-2.5 text-sm">
            {MISION.map((item) => (
              <li key={item} className="flex gap-2.5">
                <Check color="#7BE07C" />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <LandingButton href="/registro" variant="tertiary">
              Inscribirme
            </LandingButton>
          </div>
        </Reveal>

        <Reveal
          delay={0.2}
          className="rounded-[32px] border border-slate-200 bg-white px-8 py-9 shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3BB546]">
            Visión
          </p>
          <p className="mt-3 text-lg leading-relaxed text-[#0D212C]">
            Ser una academia referente a nivel nacional en preparación para el
            ENCAPS–SERUMS, reconocida por su calidad y sus resultados.
          </p>
          <ul className="mt-6 space-y-2.5 text-sm text-[#051A24]">
            {VISION.map((item) => (
              <li key={item} className="flex gap-2.5">
                <Check color="#013C9A" />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <LandingButton href="#areas" variant="primary">
              Ver áreas del examen
            </LandingButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
