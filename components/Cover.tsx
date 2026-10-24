/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";

/** Cover image from Qloo, with a letter tile if there is no image or it fails to load. */
export default function Cover({ src, name, w, h, className }: { src?: string; name: string; w: number; h: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <span className={`cover-blank ${className ?? ""}`} style={{ width: w, height: h }} aria-hidden="true">
        {name.slice(0, 1)}
      </span>
    );
  }
  return <img className={className} src={src} alt="" width={w} height={h} onError={() => setFailed(true)} />;
}
