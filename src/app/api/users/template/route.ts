import { NextResponse } from "next/server";
import { requireRole } from "@/lib/guards";
import { toCsv } from "@/lib/csv";

/** Plantilla CSV (se abre y edita directo en Excel) para la carga masiva de alumnos. */
export async function GET() {
  const session = await requireRole("ADMIN");
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const csv = toCsv([
    ["Nombre", "Correo", "Rol", "Telefono", "Documento", "Cursos"],
    [
      "Juan Pérez",
      "juan.perez@correo.com",
      "Alumno",
      "987654321",
      "12345678",
      "Salud Pública, Ética e Interculturalidad",
    ],
  ]);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="plantilla-alumnos-ruta360.csv"',
    },
  });
}
