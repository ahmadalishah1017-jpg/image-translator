"use client";

import { Maximize2, RefreshCw, Trash2, ZoomIn, ZoomOut } from "lucide-react";
import { useRef, useState } from "react";
import { btn, card } from "@/components/ui";
import { ACCEPT_ATTRIBUTE, type LoadedImage } from "@/lib/image";

interface Props {
  image: LoadedImage;
  busy: boolean;
  onReplace: (file: File) => void;
  onRemove: () => void;
}

const MIN = 0.5;
const MAX = 3;
const STEP = 0.25;

export function ImagePanel({ image, busy, onReplace, onRemove }: Props) {
  const [zoom, setZoom] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <section aria-label="Original image" className={`${card} flex flex-col overflow-hidden`}>
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-ink">Original image</h2>
          <p className="truncate text-xs text-ink-muted" title={image.name}>
            {image.name} · {image.width}×{image.height}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            className={btn.icon}
            onClick={() => setZoom((z) => Math.max(MIN, z - STEP))}
            disabled={zoom <= MIN}
            aria-label="Zoom out"
          >
            <ZoomOut className="size-4" />
          </button>
          <span className="w-12 text-center text-xs font-semibold tabular-nums text-ink-soft" aria-live="polite">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            className={btn.icon}
            onClick={() => setZoom((z) => Math.min(MAX, z + STEP))}
            disabled={zoom >= MAX}
            aria-label="Zoom in"
          >
            <ZoomIn className="size-4" />
          </button>
          <button type="button" className={btn.icon} onClick={() => setZoom(1)} aria-label="Fit to panel">
            <Maximize2 className="size-4" />
          </button>
        </div>
      </div>

      <div
        className="relative h-72 overflow-auto bg-[repeating-conic-gradient(#f1f3f9_0%_25%,#ffffff_0%_50%)] bg-[length:20px_20px] sm:h-96"
        tabIndex={0}
        aria-label="Image preview, scrollable when zoomed"
      >
        <div
          className="flex min-h-full items-center justify-center p-3"
          style={{ width: `${zoom * 100}%`, minWidth: "100%" }}
        >
          {/* Object URL of a local file — next/image optimisation doesn't apply. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.url}
            alt="Uploaded image to translate"
            className="max-w-full rounded-lg shadow-card"
            style={zoom === 1 ? { maxHeight: "100%" } : { width: "100%" }}
          />
        </div>
      </div>

      <div className="flex gap-2 border-t border-line p-3">
        <button
          type="button"
          className={`${btn.secondary} flex-1 text-sm`}
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          Replace image
        </button>
        <button
          type="button"
          className={`${btn.secondary} flex-1 text-sm hover:border-red-200 hover:bg-red-50 hover:text-red-700`}
          onClick={onRemove}
        >
          <Trash2 className="size-4" aria-hidden="true" />
          Remove
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          className="sr-only"
          tabIndex={-1}
          aria-label="Replace image"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onReplace(file);
            e.target.value = "";
          }}
        />
      </div>
    </section>
  );
}
