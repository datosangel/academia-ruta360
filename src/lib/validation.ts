import { z } from "zod";

/**
 * Acepta una URL absoluta (enlace externo pegado) o una ruta relativa de un
 * archivo subido por /api/upload (p. ej. "/uploads/1690000-ab12cd.pdf").
 */
export const urlOrUploadPath = z
  .string()
  .refine(
    (v) => v === "" || /^https?:\/\//.test(v) || v.startsWith("/uploads/"),
    "Pega un enlace válido, o sube un archivo"
  )
  .optional()
  .or(z.literal(""));
