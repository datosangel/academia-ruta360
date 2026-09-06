import Link from "next/link";

const TABS = [
  { key: "silabo", label: "Sílabo" },
  { key: "contenido", label: "Contenido" },
  { key: "evaluaciones", label: "Evaluaciones" },
  { key: "tareas", label: "Tareas" },
  { key: "foros", label: "Foros" },
  { key: "notas", label: "Notas" },
  { key: "anuncios", label: "Anuncios" },
  { key: "zoom", label: "Zoom" },
] as const;

export type TabKey = (typeof TABS)[number]["key"];

export function CourseTabBar({
  baseHref,
  active,
}: {
  baseHref: string;
  active: TabKey;
}) {
  return (
    <div className="overflow-x-auto border-b border-slate-200 bg-white px-4 sm:px-8">
      <div className="flex min-w-max gap-1">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`${baseHref}?tab=${tab.key}`}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition ${
              active === tab.key
                ? "border-[#013C9A] text-[#013C9A]"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
