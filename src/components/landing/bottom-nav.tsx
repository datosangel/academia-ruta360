import Image from "next/image";
import { LandingButton } from "@/components/landing/landing-button";

export function BottomNav() {
  return (
    <nav className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <div className="shadow-btn-secondary flex items-center gap-3 rounded-full bg-white py-2 pl-3 pr-2">
        <Image
          src="/logo-academia-ruta360.jpg"
          alt="Academia Ruta 360"
          width={32}
          height={32}
          className="h-8 w-8 rounded-full object-contain"
        />
        <span className="hidden whitespace-nowrap text-sm font-semibold text-[#013C9A] sm:inline">
          Ruta 360
        </span>
        <LandingButton href="/login" className="px-6 py-2">
          Ingresar
        </LandingButton>
      </div>
    </nav>
  );
}
