"use client";

export function ProtectedPdfViewer({
  src,
  watermarkText,
}: {
  src: string;
  watermarkText: string;
}) {
  return (
    <div
      className="relative h-[70vh] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      <iframe
        src={`${src}#toolbar=0`}
        className="h-full w-full"
        title="Documento del curso"
      />
      <div className="pointer-events-none absolute bottom-3 right-3 rounded bg-black/30 px-2 py-1 text-xs font-medium text-white/80">
        {watermarkText}
      </div>
    </div>
  );
}
