import Link from "next/link";

const ACCENTS = {
  brand: "from-[#013C9A] to-[#0a56b8]",
  green: "from-[#3BB546] to-[#2f9639]",
  amber: "from-amber-500 to-amber-600",
  red: "from-red-500 to-red-600",
} as const;

export function StatCard({
  label,
  value,
  href,
  icon,
  accent = "brand",
}: {
  label: string;
  value: string | number;
  /** Si se indica, la tarjeta es clicable y lleva al detalle. */
  href?: string;
  /** Emoji o símbolo corto para el círculo de acento. */
  icon?: string;
  accent?: keyof typeof ACCENTS;
}) {
  const content = (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      {icon && (
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-lg text-white ${ACCENTS[accent]}`}
        >
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-0.5 text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
