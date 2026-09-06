import Image from "next/image";
import Link from "next/link";
import { PrintButton } from "@/components/print-button";

const dateFmt = new Intl.DateTimeFormat("es", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

/**
 * Lámina del certificado. Se usa tal cual para la vista del alumno y para la
 * página pública de validación (esta última sin acciones).
 */
export function CertificateSheet({
  studentName,
  courseTitle,
  teacherName,
  durationHrs,
  issuedAt,
  code,
  backHref,
}: {
  studentName: string;
  courseTitle: string;
  teacherName: string;
  durationHrs: number | null;
  issuedAt: Date;
  code: string;
  /** Si se indica, muestra la barra con "volver" e "imprimir". */
  backHref?: string;
}) {
  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 print:bg-white print:p-0">
      {backHref && (
        <div className="mx-auto mb-6 flex max-w-4xl items-center justify-between print:hidden">
          <Link
            href={backHref}
            className="text-sm font-medium text-slate-600 hover:text-indigo-600"
          >
            ← Volver a mis certificados
          </Link>
          <PrintButton />
        </div>
      )}

      <div className="mx-auto max-w-4xl bg-white p-10 shadow-lg print:max-w-none print:p-0 print:shadow-none">
        <div className="border-[6px] border-double border-[#013C9A] px-8 py-12 text-center sm:px-16">
          <Image
            src="/logo-academia-ruta360.jpg"
            alt="Academia Ruta 360"
            width={90}
            height={90}
            className="mx-auto h-[90px] w-[90px] object-contain"
          />
          <p className="mt-2 text-[11px] uppercase tracking-[0.3em] text-slate-500">
            Certificado de preparación
          </p>

          <p className="mt-10 text-sm text-slate-600">Se otorga el presente a</p>
          <p className="font-accent mt-2 text-4xl text-[#0D212C] sm:text-5xl">
            {studentName}
          </p>

          <p className="mt-8 text-sm text-slate-600">
            por haber completado satisfactoriamente el curso
          </p>
          <p className="mt-2 text-2xl font-semibold text-[#0D212C]">
            {courseTitle}
          </p>

          {durationHrs && (
            <p className="mt-2 text-sm text-slate-600">
              con una duración de {durationHrs} horas académicas
            </p>
          )}

          <div className="mt-12 flex flex-col items-center justify-between gap-8 sm:flex-row">
            <div className="text-center">
              <div className="w-48 border-t border-slate-400 pt-2 text-xs text-slate-600">
                {teacherName}
                <br />
                <span className="text-slate-400">Docente del curso</span>
              </div>
            </div>
            <div className="text-center">
              <div className="w-48 border-t border-slate-400 pt-2 text-xs text-slate-600">
                {dateFmt.format(issuedAt)}
                <br />
                <span className="text-slate-400">Fecha de emisión</span>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-slate-200 pt-4">
            <p className="font-mono text-xs text-slate-500">
              Código de validación: <strong>{code}</strong>
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Verifica su autenticidad en /validar/{code}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
