"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/#cursos-disponibles", label: "Cursos" },
  { href: "/#nosotros", label: "Quiénes somos" },
  { href: "/#areas", label: "Áreas del examen" },
];

export function LandingShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 md:h-[72px] md:px-8">
          <Link href="/" className="flex items-center gap-2.5">
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
          </Link>

          {/* Navegación de escritorio */}
          <nav className="hidden items-center gap-8 md:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="relative text-sm font-medium text-slate-600 transition-colors hover:text-[#013C9A] after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-[#013C9A] after:transition-all after:duration-300 hover:after:w-full"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            <Link
              href="/login"
              className="hidden rounded-full px-4 py-2 text-sm font-semibold text-[#013C9A] transition hover:bg-[#013C9A]/5 sm:inline-block"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/registro"
              className="hidden rounded-full bg-[#013C9A] px-5 py-2.5 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#013C9A]/25 active:translate-y-0 sm:inline-block"
            >
              Crear cuenta
            </Link>

            <button
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={open}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-[#0D212C] transition hover:bg-slate-100 md:hidden"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
                {open ? (
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                ) : (
                  <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Panel desplegable en móvil */}
        {open && (
          <div className="animate-fade-in-up border-t border-slate-200 bg-white px-5 pb-5 pt-2 md:hidden">
            <nav className="flex flex-col">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="border-b border-slate-100 py-3.5 text-sm font-medium text-slate-700 transition hover:text-[#013C9A]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-4 flex flex-col gap-2">
              <Link
                href="/registro"
                onClick={() => setOpen(false)}
                className="rounded-full bg-[#013C9A] px-5 py-3 text-center text-sm font-semibold text-white"
              >
                Crear cuenta
              </Link>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="rounded-full border border-slate-200 px-5 py-3 text-center text-sm font-semibold text-[#013C9A]"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>
        )}
      </header>

      <main>{children}</main>
    </div>
  );
}
