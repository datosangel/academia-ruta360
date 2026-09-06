"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/landing/reveal";
import { unsplashUrl } from "@/components/landing/course-tiles";

/** Desplaza el elemento a distinta velocidad que el scroll, con tope de 60px. */
function useParallax<T extends HTMLElement>(max = 60) {
  const ref = useRef<T | null>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let active = false;

    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const progress =
        (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
      setOffset((progress - 0.5) * -2 * max);
    };

    const onScroll = () => {
      if (!active || frame) return;
      frame = requestAnimationFrame(update);
    };

    const observer = new IntersectionObserver(([entry]) => {
      active = entry.isIntersecting;
      if (active) update();
    });

    observer.observe(el);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [max]);

  return { ref, offset };
}

export function QuoteSection() {
  const { ref, offset } = useParallax<HTMLDivElement>();

  return (
    <section className="mx-auto max-w-2xl px-6 py-12 text-center">
      <Reveal delay={0.1} className="flex justify-center">
        <svg
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-slate-900"
          aria-hidden="true"
        >
          <path d="M10 11H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v7c0 2.2-1.8 4-4 4" />
          <path d="M19 11h-4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v7c0 2.2-1.8 4-4 4" />
        </svg>
      </Reveal>

      <Reveal
        as="h2"
        delay={0.2}
        className="mt-6 text-[32px] leading-[1.1] tracking-tight text-[#0D212C] md:text-[40px] lg:text-[44px]"
      >
        Comprende, practica, corrige y{" "}
        <span className="font-accent">mejora</span>
      </Reveal>

      <Reveal as="p" delay={0.3} className="mt-6 text-sm italic text-[#273C46]">
        Nuestra metodología de preparación
      </Reveal>

      <Reveal
        delay={0.4}
        className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-2"
      >
        <span className="text-xl font-medium text-[#013C9A] sm:text-2xl">
          Medicina
        </span>
        <span className="text-xl font-medium text-[#013C9A] sm:text-2xl">
          Enfermería
        </span>
        <span className="text-xl font-medium text-[#3BB546] sm:text-2xl">
          Obstetricia
        </span>
      </Reveal>

      <Reveal delay={0.5} className="mt-12 flex justify-center">
        <div
          ref={ref}
          style={{ transform: `translateY(${offset}px)` }}
          className="relative flex h-72 w-full max-w-xs flex-col justify-end overflow-hidden rounded-2xl p-5 shadow-lg will-change-transform"
        >
          <Image
            src={unsplashUrl("photo-1547567667-1aa64e6f58dc", 640, 800)}
            alt="Estudiante de salud repasando su material"
            fill
            sizes="320px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

          <p className="relative text-[11px] font-medium uppercase tracking-widest text-white/70">
            Progreso del alumno
          </p>
          <p className="relative mt-1 text-3xl font-semibold text-white">78%</p>
          <div className="relative mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/25">
            <div className="h-full w-[78%] rounded-full bg-white" />
          </div>
        </div>
      </Reveal>
    </section>
  );
}
