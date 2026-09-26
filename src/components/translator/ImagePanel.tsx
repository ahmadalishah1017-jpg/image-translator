"use client";

import { Maximize2, RefreshCw, Trash2, ZoomIn, ZoomOut } from "lucide-react";
import { useRef, useState } from "react";
import { btn, card } from "@/components/ui";
import { ACCEPT_ATTRIBUTE } from "@/lib/image";

interface Props {
  /** The uploaded image. Absent when a scan is reopened from history. */
  original?: { url: string; name: string; width: number; height: number };
  /** The translated image, once available. */
  translatedUrl?: string;
  title?: string;
  busy: boolean;
  onReplace: (file: File) => void;
  onRemove: () => void;
}

const MIN = 0.5;
const MAX = 3;
const STEP = 0.25;

export function ImagePanel({ original, translatedUrl, title, busy, onReplace, onRemove }: Props) {
  const [zoom, setZoom] = useState(1);
  // Remember which translated image the user switched to "Original" for, so a new translation shows by default.
  const [originalFor, setOriginalFor] = useState<string | undefined>();
  const inputRef = useRef<HTMLInputElement>(null);

  const canCompare = Boolean(original && translatedUrl);
  const showOriginal = !translatedUrl || (canCompare && originalFor === translatedUrl);
  const src = showOriginal ? original?.url : translatedUrl;

  return (
    <section aria-label="Image" className={`${card} flex flex-col overflow-hidden`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
        {canCompare ? (
          <div role="group" aria-label="Choose image view" className="inline-flex rounded-xl bg-surface p-1">
            {[
              { label: "Translated", active: !showOriginal, onClick: () => setOriginalFor(undefined) },
              { label: "Original", active: showOriginal, onClick: () => setOriginalFor(translatedUrl) },
            ].map((tab) => (
              <button
                key={tab.label}
                type="button"
                aria-pressed={tab.active}
                onClick={tab.onClick}
                className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition ${
                  tab.active ? "bg-white text-ink shadow-sm" : "text-ink-muted hover:text-ink"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-ink">{translatedUrl ? "Translated image" : "Original image"}</h2>
            <p className="truncate text-xs text-ink-muted" title={original?.name ?? title}>
              {original ? `${original.name} · ${original.width}×${original.height}` : title}
            </p>
          </div>
        )}
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
        className="relative h-80 overflow-auto bg-[repeating-conic-gradient(#f1f3f9_0%_25%,#ffffff_0%_50%)] bg-[length:20px_20px] sm:h-[28rem]"
        tabIndex={0}
        aria-label="Image preview, scrollable when zoomed"
      >
        <div
          className="flex min-h-full items-center justify-center p-3"
          style={{ width: `${zoom * 100}%`, minWidth: "100%" }}
        >
          {src && (
            // Object/data URL of a local image — next/image optimisation doesn't apply.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt={showOriginal ? "Original uploaded image" : "Image with its text translated"}
              className="max-w-full animate-fade-up rounded-lg shadow-card"
              style={zoom === 1 ? { maxHeight: "100%" } : { width: "100%" }}
            />
          )}
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
          {original ? "Replace image" : "Upload new image"}
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
