import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { requireRole } from "@/lib/guards";

const DOC_EXT = [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx"];
const VIDEO_EXT = [".mp4", ".webm", ".mov", ".m4v"];
const MAX_BYTES: Record<"documento" | "video", number> = {
  documento: 25 * 1024 * 1024,
  video: 500 * 1024 * 1024,
};

/**
 * Sube un archivo real (documento, PPT, PDF o video) al disco del servidor,
 * bajo public/uploads. No hay grabación en vivo: el docente sube el archivo
 * ya grabado/exportado desde su computadora.
 */
export async function POST(req: Request) {
  const session = await requireRole("ADMIN", "DOCENTE");
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Selecciona un archivo" }, { status: 400 });
  }

  const ext = path.extname(file.name).toLowerCase();
  const kind: "documento" | "video" | null = VIDEO_EXT.includes(ext)
    ? "video"
    : DOC_EXT.includes(ext)
      ? "documento"
      : null;

  if (!kind) {
    return NextResponse.json(
      { error: "Tipo de archivo no permitido (usa PDF, Word, PowerPoint, Excel o video MP4/WebM/MOV)" },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES[kind]) {
    return NextResponse.json(
      { error: `El archivo supera el máximo permitido (${MAX_BYTES[kind] / (1024 * 1024)} MB)` },
      { status: 400 }
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, safeName), bytes);

  return NextResponse.json({ ok: true, url: `/uploads/${safeName}`, name: file.name, kind });
}
