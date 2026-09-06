import Link from "next/link";

type Variant = "primary" | "secondary" | "tertiary";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-[#013C9A] text-white shadow-btn-primary hover:brightness-110",
  secondary: "bg-white text-[#013C9A] shadow-btn-secondary hover:bg-slate-50",
  tertiary:
    "bg-white text-[#013C9A] shadow-btn-primary hover:bg-slate-50 border border-black/5",
};

export function LandingButton({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-medium transition duration-200 active:translate-y-px ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
