"use client";

import { useEffect, useState } from "react";

export function ProtectedVideoPlayer({
  src,
  watermarkText,
}: {
  src: string;
  watermarkText: string;
}) {
  const [position, setPosition] = useState({ top: "10%", left: "8%" });

  useEffect(() => {
    const interval = setInterval(() => {
      setPosition({
        top: `${10 + Math.random() * 70}%`,
        left: `${5 + Math.random() * 75}%`,
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="relative aspect-video w-full overflow-hidden rounded-xl bg-black select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      <video
        key={src}
        src={src}
        controls
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        disableRemotePlayback
        className="h-full w-full"
      />
      <div
        className="pointer-events-none absolute select-none whitespace-nowrap rounded bg-black/30 px-2 py-1 text-xs font-medium text-white/70 transition-all duration-1000"
        style={{ top: position.top, left: position.left }}
      >
        {watermarkText}
      </div>
    </div>
  );
}
