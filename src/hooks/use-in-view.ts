"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Devuelve una ref y un booleano que pasa a true la primera vez que el
 * elemento entra en pantalla. Se usa para disparar las animaciones de entrada.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  threshold = 0.1
) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}
