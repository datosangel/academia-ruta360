import Link from "next/link";

const SECTIONS = [
  {
    title: "Cómo empezar un curso",
    description:
      "Ve a Cursos → Catálogo, pulsa «Matricularme» y luego «Empezar curso» para abrir las clases.",
    href: "/alumno",
  },
  {
    title: "Cómo registrar tu avance",
    description:
      "Dentro de cada lección, pulsa «Marcar como completada». Tu porcentaje se actualiza solo.",
    href: "/alumno",
  },
  {
    title: "Cómo obtener tu certificado",
    description:
      "Al completar el 100% de un curso, el certificado se emite automáticamente en la sección Certificados.",
    href: "/alumno/certificados",
  },
  {
    title: "Cómo escribir a tu docente",
    description:
      "En Chat pulsa «+ Crear» y elige a la persona. Solo aparecen quienes comparten curso contigo.",
    href: "/chat",
  },
  {
    title: "Cómo cambiar tu foto y contraseña",
    description:
      "En Configuración puedes actualizar tu foto, tus datos personales y tu contraseña.",
    href: "/perfil",
  },
];

export default function AyudaPage() {
  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <h1 className="text-xl font-bold">Ayuda</h1>
        <p className="text-sm text-slate-600">
          Guías rápidas para sacarle provecho a la plataforma.
        </p>
      </div>

      <div className="space-y-3">
        {SECTIONS.map((section) => (
          <Link
            key={section.title}
            href={section.href}
            className="block rounded-lg border-l-4 border-indigo-500 bg-white px-5 py-4 shadow-sm transition hover:shadow-md"
          >
            <p className="font-medium text-slate-900">{section.title}</p>
            <p className="mt-0.5 text-sm text-slate-600">
              {section.description}
            </p>
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold">¿Necesitas más ayuda?</h2>
        <p className="mt-1 text-sm text-slate-600">
          Escríbele directamente a tu docente desde el{" "}
          <Link href="/chat" className="text-indigo-600 hover:underline">
            chat
          </Link>
          , o contacta al área académica de tu institución.
        </p>
      </div>
    </div>
  );
}
