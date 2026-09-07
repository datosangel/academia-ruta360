import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AvailableCourses } from "@/components/landing/available-courses";
import { BottomNav } from "@/components/landing/bottom-nav";
import { CourseMarquee } from "@/components/landing/course-marquee";
import { FeaturedCourses } from "@/components/landing/featured-courses";
import { LandingButton } from "@/components/landing/landing-button";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingShell } from "@/components/landing/landing-shell";
import { PartnerSection } from "@/components/landing/partner-section";
import { PlansSection } from "@/components/landing/plans-section";
import { QuoteSection } from "@/components/landing/quote-section";
import { Reveal } from "@/components/landing/reveal";
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
      <section className="relative overflow-hidden bg-gradient-to-b from-[#013C9A]/[0.04] to-white">
        <span className="animate-hero-blob pointer-events-none absolute -left-16 top-8 h-40 w-40 rounded-[40%] bg-[#013C9A]/10 blur-2xl md:h-64 md:w-64" />
        <span className="animate-hero-blob-reverse pointer-events-none absolute -right-10 top-32 h-32 w-32 rounded-[45%] bg-[#3BB546]/15 blur-2xl md:h-52 md:w-52" />
        <span className="animate-hero-blob pointer-events-none absolute bottom-0 left-1/3 h-24 w-24 rounded-[50%] bg-amber-200/40 blur-2xl md:h-40 md:w-40" />

        <div className="relative mx-auto max-w-[480px] px-6 pt-14 text-center md:pt-20">
          <Reveal delay={0.1}>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#013C9A]/10 px-4 py-1.5 text-xs font-semibold text-[#013C9A] md:text-sm">
              <span aria-hidden>🩺</span> Academia Ruta 360
            </span>
          </Reveal>

          <Reveal delay={0.2}>
            <h1 className="mt-5 text-[34px] font-bold leading-[1.15] tracking-tight text-[#0D212C] md:text-[44px] lg:text-[48px]">
              Prepárate con método,
              <br />
              no con <span className="text-[#013C9A]">memoria</span>.
            </h1>
          </Reveal>

          <Reveal delay={0.3}>
            <p className="mt-4 text-sm text-slate-500 md:text-base">
              Preparación para el ENCAPS–SERUMS: conocimiento, experiencia e
              innovación.
            </p>
          </Reveal>

          <Reveal delay={0.4}>
            <div className="mt-6 flex flex-col gap-4 text-left text-sm leading-relaxed text-slate-600 md:mt-8 md:text-base">
              <p>
                Somos una comunidad académica enfocada en acompañar a los
                profesionales de la salud en su preparación para el
                ENCAPS–SERUMS, con conocimiento, práctica y evaluación
                continua.
              </p>
              <p className="font-semibold text-[#0D212C]">
                Te acompañamos desde el inicio hasta el proceso de adjudicación.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.5}>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center md:mt-8 md:gap-4">
              <LandingButton href="/registro">
                Empezar mi preparación
              </LandingButton>
              <LandingButton href="/login" variant="secondary">
                Ya tengo cuenta
              </LandingButton>
            </div>
          </Reveal>

          <Reveal delay={0.6}>
            <div className="mt-8 flex flex-wrap justify-center gap-2 pb-14 md:pb-20">
              {[
                { icon: "🩺", label: "Áreas del ENCAPS" },
                { icon: "📚", label: "Contenido por semanas" },
                { icon: "📊", label: "Evaluación continua" },
              ].map((item) => (
                <span
                  key={item.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span aria-hidden>{item.icon}</span> {item.label}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <AvailableCourses />
      <CourseMarquee />
      <QuoteSection />
      <PlansSection />
      <TestimonialCarousel />
      <FeaturedCourses />
      <PartnerSection />
      <LandingFooter />
      <BottomNav />
    </LandingShell>
  );
}
