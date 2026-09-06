"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SidebarLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  /** Icono ya renderizado: los componentes no cruzan la frontera servidor/cliente. */
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // La sección de cursos («/alumno») también debe marcarse en sus subrutas.
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`relative flex flex-col items-center gap-1 px-1 py-3 text-[10px] font-medium leading-tight transition sm:text-[11px] ${
        active
          ? "bg-white/[0.07] text-white"
          : "text-white/60 hover:bg-white/[0.04] hover:text-white"
      }`}
    >
      {active && (
        <span className="absolute inset-y-0 left-0 w-[3px] bg-indigo-400" />
      )}
      {children}
      <span className="text-center">{label}</span>
    </Link>
  );
}
