/**
 * CSV mínimo y seguro (sin dependencias externas): Excel abre y guarda CSV
 * de forma nativa, así que sirve como "plantilla de Excel" sin necesitar una
 * librería de parseo de .xlsx (las disponibles en npm tienen vulnerabilidades
 * sin parche conocidas — no vale la pena el riesgo para leer archivos que
 * cualquier admin puede subir).
 */

/** Arma una fila CSV, entre comillas si el valor tiene coma, comilla o salto de línea. */
export function toCsvRow(fields: (string | number)[]): string {
  return fields
    .map((f) => {
      const s = String(f ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    })
    .join(",");
}

export function toCsv(rows: (string | number)[][]): string {
  return rows.map(toCsvRow).join("\r\n") + "\r\n";
}

/** Parser RFC4180 básico: comillas dobles, comas y saltos de línea dentro de campos citados. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  // Normaliza saltos de línea y quita un posible BOM inicial (típico al guardar desde Excel).
  const src = text.replace(/^﻿/, "").replace(/\r\n/g, "\n");

  for (let i = 0; i < src.length; i++) {
    const c = src[i];

    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((f) => f.trim() !== ""));
}
