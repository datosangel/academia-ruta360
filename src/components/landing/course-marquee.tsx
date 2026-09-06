import Image from "next/image";
import { COURSE_TILES, unsplashUrl } from "@/components/landing/course-tiles";

function Tile({
  title,
  category,
  photoId,
  alt,
  priority,
}: {
  title: string;
  category: string;
  photoId: string;
  alt: string;
  priority: boolean;
}) {
  return (
    <div className="relative mx-3 h-[220px] w-[170px] shrink-0 overflow-hidden rounded-2xl shadow-lg md:h-[320px] md:w-[250px]">
      <Image
        src={unsplashUrl(photoId, 500, 640)}
        alt={alt}
        width={250}
        height={320}
        priority={priority}
        // El marquee se desplaza solo: si las fotos fueran diferidas
        // aparecerían en blanco al entrar en pantalla.
        loading="eager"
        sizes="250px"
        className="h-full w-full object-cover"
      />
      {/* Degradado para que el texto se lea sobre cualquier foto. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="text-[11px] font-medium uppercase tracking-widest text-white/75">
          {category}
        </p>
        <p className="mt-1 text-lg font-semibold leading-tight text-white md:text-xl">
          {title}
        </p>
      </div>
    </div>
  );
}

export function CourseMarquee() {
  // La lista va duplicada: la animación desplaza -50%, así el ciclo es continuo.
  const tiles = [...COURSE_TILES, ...COURSE_TILES];

  return (
    <div className="mt-16 mb-16 w-full overflow-hidden md:mt-20">
      <div className="animate-marquee flex w-max">
        {tiles.map((tile, i) => (
          <Tile key={`${tile.title}-${i}`} {...tile} priority={i < 4} />
        ))}
      </div>
    </div>
  );
}
