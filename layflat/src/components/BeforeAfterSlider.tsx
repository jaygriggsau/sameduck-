"use client";

import { useState } from "react";

type Props = {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
};

export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = "Before",
  afterLabel = "After",
}: Props) {
  const [value, setValue] = useState(55);

  return (
    <div className="surface-card relative overflow-hidden">
      <div className="relative aspect-[4/5] w-full bg-zinc-100 sm:aspect-[2/3]">
        {/* Before image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={beforeSrc} alt={beforeLabel} className="absolute inset-0 h-full w-full object-cover" />

        {/* After image clipped by slider */}
        <div className="absolute inset-0 overflow-hidden" style={{ width: `${value}%` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={afterSrc} alt={afterLabel} className="h-full w-full object-cover" />
        </div>

        {/* Divider line + thumb */}
        <div className="pointer-events-none absolute inset-y-0" style={{ left: `${value}%` }}>
          <div className="h-full w-0.5 -translate-x-1/2 bg-white/95 shadow-[0_0_0_1px_rgba(0,0,0,0.08)]" />
          <div className="absolute left-1/2 top-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow sm:size-8">
            <span className="text-xs">↔</span>
          </div>
        </div>

        {/* Top labels */}
        <div className="pointer-events-none absolute left-2 top-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white min-[390px]:left-3 min-[390px]:top-3 min-[390px]:px-2 min-[390px]:py-1 min-[390px]:text-[11px]">
          {beforeLabel}
        </div>
        <div className="pointer-events-none absolute right-2 top-2 rounded-md bg-violet-600/90 px-1.5 py-0.5 text-[10px] font-medium text-white min-[390px]:right-3 min-[390px]:top-3 min-[390px]:px-2 min-[390px]:py-1 min-[390px]:text-[11px]">
          {afterLabel}
        </div>

        {/* Drag input */}
        <input
          aria-label="Before and after slider"
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-ew-resize appearance-none bg-transparent opacity-0"
        />
      </div>
    </div>
  );
}

