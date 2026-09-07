"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { COURSE_TILES, unsplashUrl } from "@/components/landing/course-tiles";
import { Reveal } from "@/components/landing/reveal";

type Trail = {
  id: number;
  x: number;
  y: number;
  rotation: number;
  tile: (typeof COURSE_TILES)[number];
};

const SPAWN_INTERVAL_MS = 80;
const TRAIL_LIFETIME_MS = 1000;

export function PartnerSection() {
  const [trails, setTrails] = useState<Trail[]>([]);
  const lastSpawn = useRef(0);
  const nextId = useRef(0);
  const tileIndex = useRef(0);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const pending = timeouts.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const now = Date.now();
      if (now - lastSpawn.current < SPAWN_INTERVAL_MS) return;
      lastSpawn.current = now;

      const rect = e.currentTarget.getBoundingClientRect();
      const id = nextId.current++;
      const tile = COURSE_TILES[tileIndex.current++ % COURSE_TILES.length];

      setTrails((prev) => [
        ...prev,
        {
          id,
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          rotation: Math.random() * 20 - 10,
          tile,
        },
      ]);

      const timeout = setTimeout(() => {
        setTrails((prev) => prev.filter((t) => t.id !== id));
      }, TRAIL_LIFETIME_MS);
      timeouts.current.push(timeout);
    },
    []
  );

  return (
    <section className="w-full px-6 py-12">
      <div
        onMouseMove={handleMouseMove}
        className="relative mx-auto max-w-7xl overflow-hidden rounded-[40px] bg-white py-40 shadow-[0_0_0_0.5px_rgba(0,0,0,0.05),0_4px_30px_rgba(0,0,0,0.06)]"
      >
        {trails.map((trail) => (
          <div
            key={trail.id}
            className="animate-trail-fade pointer-events-none absolute"
            style={{ left: trail.x - 40, top: trail.y - 48 }}
          >
            <div
              className="h-24 w-20 overflow-hidden rounded-xl shadow-lg"
              style={{ transform: `rotate(${trail.rotation}deg)` }}
            >
              <Image
                src={unsplashUrl(trail.tile.photoId, 200, 240)}
                alt=""
                width={80}
                height={96}
                sizes="80px"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        ))}

        <div className="relative z-10 flex flex-col items-center px-6">
          <Reveal as="h2" className="font-accent text-center text-[40px] leading-[1.05] text-[#013C9A] md:text-[56px] lg:text-[68px]">
            Juntos rumbo a tu
            <br />
            <span className="text-[#3BB546]">plaza remunerada</span>
          </Reveal>

          <Reveal delay={0.15}>
            <Link
              href="/registro"
              className="shadow-btn-primary mt-12 inline-flex items-center gap-3 rounded-full bg-[#013C9A] py-2 pl-2 pr-7 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:brightness-110 active:translate-y-px"
            >
              <Image
                src="/logo-academia-ruta360.jpg"
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 rounded-full bg-white object-contain"
              />
              Empezar mi preparación
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
