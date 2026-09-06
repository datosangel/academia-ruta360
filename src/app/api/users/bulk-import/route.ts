import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guards";
import { parseCsv } from "@/lib/csv";

const ROLE_ALIASES: Record<string, "ADMIN" | "DOCENTE" | "ALUMNO"> = {
  ADMIN: "ADMIN",
  ADMINISTRADOR: "ADMIN",
  DOCENTE: "DOCENTE",
  PROFESOR: "DOCENTE",
  ALUMNO: "ALUMNO",
  ESTUDIANTE: "ALUMNO",
};

function normalizeRole(raw: string | undefined): "ADMIN" | "DOCENTE" | "ALUMNO" {
  const key = (raw ?? "").trim().toUpperCase();
  return ROLE_ALIASES[key] ?? "ALUMNO";
}

/**
 * Carga masiva de usuarios desde un CSV (la plantilla de /api/users/template,
 * exportable/editable en Excel). Crea cuentas con contraseña temporal
 * aleatoria y, si se indican cursos, matricula al alumno en ellos.
 */
export async function POST(req: Request) {
  const session = await requireRole("ADMIN");
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Selecciona un archivo CSV" }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "El archivo es demasiado grande (máx. 5 MB)" }, { status: 400 });
  }

  const text = await file.text();
  const rows = parseCsv(text);
  if (rows.length < 2) {
    return NextResponse.json(
      { error: "El archivo no tiene filas de datos (además del encabezado)" },
      { status: 400 }
    );
  }

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const col = (name: string) => header.indexOf(name);
  const iName = col("nombre");
  const iEmail = col("correo");
  const iRole = col("rol");
  const iPhone = col("telefono");
  const iDoc = col("documento");
  const iCourses = col("cursos");

  if (iName === -1 || iEmail === -1) {
    return NextResponse.json(
      { error: 'El encabezado debe incluir al menos columnas "Nombre" y "Correo"' },
      { status: 400 }
    );
  }

  const dataRows = rows.slice(1);

  // Cursos disponibles, para resolver la columna "Cursos" por nombre exacto (sin mayúsculas).
  const courses = await prisma.course.findMany({ select: { id: true, title: true } });
  const courseByTitle = new Map(courses.map((c) => [c.title.trim().toLowerCase(), c.id]));

  let created = 0;
  let enrolled = 0;
  const skipped: { row: number; email: string; reason: string }[] = [];
  // Como no hay envío de correo real todavía, se devuelven las contraseñas
  // temporales para que el admin las entregue manualmente.
  const credentials: { name: string; email: string; tempPassword: string }[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const r = dataRows[i];
    const rowNum = i + 2; // +1 por encabezado, +1 por índice base 1
    const name = r[iName]?.trim();
    const email = r[iEmail]?.trim().toLowerCase();

    if (!name || !email) {
      skipped.push({ row: rowNum, email: email || "(vacío)", reason: "Falta nombre o correo" });
      continue;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      skipped.push({ row: rowNum, email, reason: "Correo inválido" });
      continue;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      skipped.push({ row: rowNum, email, reason: "Ya existe una cuenta con ese correo" });
      continue;
    }

    const role = normalizeRole(iRole !== -1 ? r[iRole] : undefined);
    const tempPassword = crypto.randomBytes(9).toString("base64url");
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        phone: iPhone !== -1 ? r[iPhone]?.trim() || null : null,
        documentId: iDoc !== -1 ? r[iDoc]?.trim() || null : null,
      },
    });
    created++;
    credentials.push({ name, email, tempPassword });

    if (role === "ALUMNO" && iCourses !== -1 && r[iCourses]?.trim()) {
      const titles = r[iCourses].split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
      for (const title of titles) {
        const courseId = courseByTitle.get(title);
        if (!courseId) continue;
        await prisma.enrollment.upsert({
          where: { courseId_studentId: { courseId, studentId: user.id } },
          update: {},
          create: { courseId, studentId: user.id },
        });
        enrolled++;
      }
    }
  }

  return NextResponse.json({ ok: true, created, enrolled, skipped, credentials });
}
