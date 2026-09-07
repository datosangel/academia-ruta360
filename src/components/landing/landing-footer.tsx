import Image from "next/image";
import Link from "next/link";

const COLUMNS = [
  {
    title: "Plataforma",
    links: [
      { label: "Cursos disponibles", href: "/#cursos-disponibles" },
      { label: "Quiénes somos", href: "/#nosotros" },
      { label: "Áreas del examen", href: "/#areas" },
    ],
  },
  {
    title: "Tu cuenta",
    links: [
      { label: "Crear cuenta", href: "/registro" },
      { label: "Iniciar sesión", href: "/login" },
      { label: "Recuperar acceso", href: "/recuperar-password" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50/60">
      <div className="mx-auto w-full max-w-[1200px] px-5 py-14 md:px-8 md:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <Image
                src="/logo-academia-ruta360.jpg"
                alt="Academia Ruta 360"
                width={40}
                height={40}
                className="h-10 w-10 rounded-lg object-contain"
              />
              <span className="text-[15px] font-bold tracking-tight text-[#0D212C]">
                Academia <span className="text-[#013C9A]">Ruta 360</span>
              </span>
            </div>

            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-600">
              Acompañamos tu preparación para el ENCAPS–SERUMS desde el inicio
              hasta el proceso de adjudicación.
            </p>

            <Link
              href="/registro"
              className="mt-6 inline-flex rounded-full bg-[#013C9A] px-6 py-3 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#013C9A]/25 active:translate-y-0"
            >
              Empezar mi preparación
            </Link>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                {column.title}
              </p>
              <ul className="mt-4 flex flex-col gap-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-600 transition hover:text-[#013C9A]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-1 border-t border-slate-200 pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="font-medium text-[#0D212C]">Academia Ruta 360</span>
          <span className="text-slate-500">
            Conocimiento · Experiencia · Innovación
          </span>
        </div>
      </div>
    </footer>
  );
}
