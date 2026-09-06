import Link from "next/link";
import { LandingButton } from "@/components/landing/landing-button";

const LINKS = [
  [
    { label: "Cursos disponibles", href: "#cursos-disponibles" },
    { label: "Quiénes somos", href: "#nosotros" },
    { label: "Áreas del examen", href: "#areas" },
  ],
  [
    { label: "Crear cuenta", href: "/registro" },
    { label: "Iniciar sesión", href: "/login" },
    { label: "Recuperar acceso", href: "/recuperar-password" },
  ],
];

export function LandingFooter() {
  return (
    <>
      <footer className="mx-auto w-full max-w-[1200px] px-6 py-12">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div>
            <LandingButton href="/registro">
              Empezar mi preparación
            </LandingButton>
            <p className="mt-4 max-w-xs text-sm text-[#051A24]/70">
              Acompañamos tu preparación desde el inicio hasta el proceso de
              adjudicación.
            </p>
          </div>

          <div className="flex gap-8">
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="#051A24"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mt-1 shrink-0"
              aria-hidden="true"
            >
              <path d="M7 17 17 7M7 7h10v10" />
            </svg>

            {LINKS.map((column, i) => (
              <ul key={i} className="flex flex-col gap-2">
                {column.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-base text-[#051A24] transition hover:opacity-70"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </footer>

      <div className="mx-auto w-full max-w-[1200px] px-6 py-4 pb-28">
        <div className="flex flex-col gap-1 text-sm text-[#051A24] sm:flex-row sm:justify-between">
          <span className="font-medium">Academia Ruta 360</span>
          <span className="text-[#051A24]/60">
            Conocimiento · Experiencia · Innovación
          </span>
        </div>
      </div>
    </>
  );
}
