"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Página principal", icon: "🏠" },
  { href: "/#cursos-disponibles", label: "Cursos disponibles", icon: "📚" },
  { href: "/#nosotros", label: "Quiénes somos", icon: "🎯" },
  { href: "/#areas", label: "Áreas del examen", icon: "🩺" },
  { href: "/login", label: "Iniciar sesión", icon: "🔑" },
  { href: "/registro", label: "Crear cuenta", icon: "✍️" },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-[#013C9A] hover:shadow-sm"
        >
          <span aria-hidden>{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function LandingShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-2 backdrop-blur md:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#013C9A] transition hover:bg-slate-100 md:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>

          <Image
            src="/logo-academia-ruta360.jpg"
            alt="Academia Ruta 360"
            width={44}
            height={44}
            className="h-11 w-11 rounded-lg object-contain"
          />

          <Link
            href="/"
            className="hidden border-b-2 border-[#013C9A] pb-3 -mb-3 text-sm font-medium text-[#013C9A] md:inline-block"
          >
            Página Principal
          </Link>
        </div>

        <Link
          href="/login"
          className="text-sm font-medium text-[#013C9A] underline-offset-4 hover:underline"
        >
          Acceder
        </Link>
      </header>

      <div className="flex">
        {/* Menú lateral fijo en escritorio */}
        <aside className="sticky top-[57px] hidden h-[calc(100vh-57px)] w-56 shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-slate-50/70 p-3 md:flex">
          <SidebarNav />
        </aside>

        {/* Cajón deslizable en móvil */}
        {open && (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              aria-label="Cerrar menú"
              className="absolute inset-0 bg-black/30"
              onClick={() => setOpen(false)}
            />
            <aside className="animate-fade-in-up absolute left-0 top-0 flex h-full w-64 flex-col gap-4 bg-white p-4 shadow-xl">
              <div className="flex items-center justify-between">
                <Image
                  src="/logo-academia-ruta360.jpg"
                  alt="Academia Ruta 360"
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-lg object-contain"
                />
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Cerrar menú"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <SidebarNav onNavigate={() => setOpen(false)} />
            </aside>
          </div>
        )}

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
