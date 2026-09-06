"use client";

import { useRef, useState } from "react";

/**
 * Campo de contenido que acepta un enlace pegado O un archivo real subido
 * al servidor (PDF, PPT, Word, Excel, video). El valor final siempre es una
 * URL: si se sube un archivo, esta URL apunta a /uploads/... en el servidor.
 */
export function FileUploadField({
  value,
  onChange,
  accept,
  placeholder,
}: {
  value: string;
  onChange: (url: string) => void;
  accept: string;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const fd = new FormData();
    fd.append("file", file);

    let res: Response;
    try {
      res = await fetch("/api/upload", { method: "POST", body: fd });
    } catch {
      setUploading(false);
      setError("No se pudo conectar con el servidor.");
      return;
    }

    const data = await res.json().catch(() => ({}));
    setUploading(false);
    if (!res.ok) {
      setError(data.error ?? "No se pudo subir el archivo");
      return;
    }

    onChange(data.url);
    setFileName(file.name);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="url"
          placeholder={placeholder ?? "Pega un enlace, o sube un archivo →"}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setFileName(null);
          }}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
        >
          {uploading ? "Subiendo..." : "📎 Subir archivo"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFile}
          className="hidden"
        />
      </div>
      {fileName && !error && <p className="text-xs text-green-600">Subido: {fileName}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
