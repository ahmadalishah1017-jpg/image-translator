"use client";

import { Camera, ClipboardPaste, ImagePlus, Lock } from "lucide-react";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { btn } from "@/components/ui";
import { ACCEPT_ATTRIBUTE } from "@/lib/image";

interface Props {
  onFile: (file: File) => void;
  onPasteUnavailable: () => void;
}

function useCapabilities() {
  const [caps, setCaps] = useState({ clipboardRead: false, camera: false, isMac: false });
  useEffect(() => {
    // Feature detection has to run after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCaps({
      clipboardRead: typeof navigator.clipboard?.read === "function",
      camera: window.matchMedia("(pointer: coarse)").matches,
      isMac: /Mac|iPhone|iPad/.test(navigator.userAgent),
    });
  }, []);
  return caps;
}

export function UploadZone({ onFile, onPasteUnavailable }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const caps = useCapabilities();

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  };

  const pasteFromClipboard = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const type = item.types.find((t) => t.startsWith("image/"));
        if (type) {
          const blob = await item.getType(type);
          onFile(new File([blob], `pasted-image.${type.split("/")[1]}`, { type }));
          return;
        }
      }
      onPasteUnavailable();
    } catch {
      onPasteUnavailable();
    }
  };

  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
      }}
      onDrop={handleDrop}
      className={`relative rounded-3xl border-2 border-dashed p-6 text-center transition sm:p-10 ${
        dragging
          ? "scale-[1.01] border-brand-500 bg-brand-50"
          : "border-brand-100 bg-white/70 hover:border-brand-500/50"
      }`}
    >
      <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-gradient text-white shadow-lift">
        <ImagePlus className="size-7" aria-hidden="true" />
      </div>
      <p className="mt-5 text-xl font-bold text-ink sm:text-2xl">Drop your image here</p>
      <p className="my-3 text-sm font-medium text-ink-muted">or</p>

      <button type="button" onClick={() => inputRef.current?.click()} className={`${btn.primary} px-7 text-base`}>
        Choose Image
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTRIBUTE}
        className="sr-only"
        tabIndex={-1}
        aria-label="Choose image"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {caps.clipboardRead ? (
          <button type="button" onClick={pasteFromClipboard} className={btn.small}>
            <ClipboardPaste className="size-4" aria-hidden="true" />
            Paste an image
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-ink-muted">
            <ClipboardPaste className="size-4" aria-hidden="true" />
            Paste with {caps.isMac ? "⌘" : "Ctrl"}+V
          </span>
        )}
        {caps.camera && (
          <>
            <button type="button" onClick={() => cameraRef.current?.click()} className={btn.small}>
              <Camera className="size-4" aria-hidden="true" />
              Take a photo
            </button>
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              tabIndex={-1}
              aria-label="Take a photo"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onFile(file);
                e.target.value = "";
              }}
            />
          </>
        )}
      </div>

      <p className="mt-6 text-xs font-semibold tracking-wider text-ink-muted">JPG • PNG • WebP · up to 10 MB</p>
      <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-ink-soft">
        <Lock className="size-3.5 text-emerald-600" aria-hidden="true" />
        Your images are processed securely in your browser and are not stored on our servers.
      </p>
    </div>
  );
}
