import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AvailableCourses } from "@/components/landing/available-courses";
import { CourseMarquee } from "@/components/landing/course-marquee";
import { FeaturedCourses } from "@/components/landing/featured-courses";
import { LandingButton } from "@/components/landing/landing-button";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingShell } from "@/components/landing/landing-shell";
import { PartnerSection } from "@/components/landing/partner-section";
import { PlansSection } from "@/components/landing/plans-section";
import { QuoteSection } from "@/components/landing/quote-section";
import { Reveal } from "@/components/landing/reveal";
import { StatsBar } from "@/components/landing/stats-bar";
import { TestimonialCarousel } from "@/components/landing/testimonial-carousel";

const ROLE_HOME: Record<string, string> = {
  ADMIN: "/admin",
  DOCENTE: "/docente",
  ALUMNO: "/alumno",
};

export default async function HomePage() {
  const session = await auth();
  if (session?.user?.role) {
    redirect(ROLE_HOME[session.user.role] ?? "/login");
  }

  return (
    <LandingShell>
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#013C9A]/[0.05] via-white to-white">
        <span className="animate-hero-blob pointer-events-none absolute -left-24 top-0 h-64 w-64 rounded-[40%] bg-[#013C9A]/10 blur-3xl md:h-96 md:w-96" />
        <span className="animate-hero-blob-reverse pointer-events-none absolute -right-20 top-24 h-56 w-56 rounded-[45%] bg-[#3BB546]/15 blur-3xl md:h-80 md:w-80" />
        <span className="animate-hero-blob pointer-events-none absolute bottom-8 left-1/2 h-40 w-40 -translate-x-1/2 rounded-[50%] bg-amber-200/30 blur-3xl md:h-56 md:w-56" />

        <div className="relative mx-auto max-w-[1200px] px-5 pb-20 pt-16 md:px-8 md:pb-28 md:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal delay={0.1}>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#013C9A]/15 bg-[#013C9A]/[0.06] px-4 py-1.5 text-xs font-semibold tracking-wide text-[#013C9A] md:text-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-[#3BB546]" />
                Preparación ENCAPS–SERUMS
              </span>
            </Reveal>

            <Reveal delay={0.2}>
              <h1 className="mt-6 text-[42px] font-extrabold leading-[1.05] tracking-[-0.03em] text-[#0D212C] md:text-[64px] lg:text-[76px]">
                Prepárate con método,
                <br className="hidden sm:block" /> no con{" "}
                <span className="relative whitespace-nowrap text-[#013C9A]">
                  memoria
                  <svg
                    viewBox="0 0 300 12"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                    className="absolute -bottom-1 left-0 h-2 w-full text-[#3BB546] md:-bottom-2 md:h-3"
                  >
                    <path
                      d="M2 8c60-5 120-6 180-4s80 3 116 1"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                .
              </h1>
            </Reveal>

            <Reveal delay={0.3}>
              <p className="mx-auto mt-7 max-w-xl text-base leading-relaxed text-slate-600 md:mt-8 md:text-lg">
                Acompañamos a los profesionales de la salud con conocimiento,
                práctica y evaluación continua —{" "}
                <span className="font-semibold text-[#0D212C]">
                  desde el primer día hasta la adjudicación.
                </span>
              </p>
            </Reveal>

            <Reveal delay={0.4}>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:justify-center md:gap-4">
                <LandingButton href="/registro" className="px-8 py-3.5 text-base">
                  Empezar mi preparación
                </LandingButton>
                <LandingButton
                  href="/login"
                  variant="secondary"
                  className="px-8 py-3.5 text-base"
                >
                  Ya tengo cuenta
                </LandingButton>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.55}>
            <div className="mx-auto mt-14 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3 md:mt-16">
              {[
                {
                  title: "Áreas del ENCAPS",
                  description: "Salud pública, gestión, cuidado integral e investigación.",
                },
                {
                  title: "Contenido por semanas",
                  description: "Videos, materiales y actividades ordenados de principio a fin.",
                },
                {
                  title: "Evaluación continua",
                  description: "Simulacros y retroalimentación de cada pregunta que fallas.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="group rounded-2xl border border-slate-200/80 bg-white/70 p-5 text-left backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-[#013C9A]/25 hover:shadow-lg hover:shadow-[#013C9A]/5"
                >
                  <span className="block h-1 w-8 rounded-full bg-[#3BB546] transition-all duration-300 group-hover:w-14" />
                  <p className="mt-4 text-sm font-bold text-[#0D212C]">
                    {item.title}
                  </p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <StatsBar />
      <AvailableCourses />
      <CourseMarquee />
      <QuoteSection />
      <PlansSection />
      <TestimonialCarousel />
      <FeaturedCourses />
      <PartnerSection />
      <LandingFooter />
    </LandingShell>
  );
}
