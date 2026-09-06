"use client";

import { useSyncExternalStore } from "react";
import { useInView } from "@/hooks/use-in-view";

const noopSubscribe = () => () => {};

/** false mientras se renderiza en el servidor, true ya en el cliente. */
function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

/**
 * Envoltorio que revela su contenido con un fade-in hacia arriba cuando entra
 * en pantalla. `delay` escalona los elementos dentro de una misma sección.
 *
 * Antes de hidratar no se aplica ninguna clase de opacidad: si el JS tarda o
 * falla, el contenido igual se ve. Solo una vez en el cliente se oculta lo que
 * aún no ha entrado en pantalla, para poder animarlo.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "p" | "h1" | "h2" | "li";
}) {
  const { ref, inView } = useInView<HTMLElement>();
  const hydrated = useHydrated();

  const state = !hydrated ? "" : inView ? "animate-fade-in-up" : "opacity-0";
  const Component = Tag as React.ElementType;

  return (
    <Component
      ref={ref}
      className={`${state} ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </Component>
  );
}
