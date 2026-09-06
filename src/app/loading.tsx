import Image from "next/image";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center gap-6 bg-white">
      <div className="relative flex h-24 w-24 items-center justify-center">
        <span className="absolute inset-0 animate-loader-ring rounded-full border-4 border-[#013C9A]/15 border-t-[#013C9A]" />
        <span className="absolute inset-2 animate-loader-ring-reverse rounded-full border-4 border-[#3BB546]/15 border-b-[#3BB546]" />
        <Image
          src="/logo-academia-ruta360.jpg"
          alt="Academia Ruta 360"
          width={48}
          height={48}
          priority
          className="h-12 w-12 rounded-full object-contain"
        />
      </div>
      <p className="animate-loader-pulse text-sm font-medium text-slate-500">
        Cargando…
      </p>
    </div>
  );
}
