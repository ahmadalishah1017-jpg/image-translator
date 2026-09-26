"use client";

import { ArrowRight, CircleCheck, ImageDown, Info, Sparkles, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { btn, card } from "@/components/ui";
import { baseFilename, downloadBlob } from "@/lib/download";
import { AppError, toAppError } from "@/lib/errors";
import { addScan, scanTitle, type ScanRecord } from "@/lib/history";
import { loadImage, renderTranslatedImage, validateImageFile, type LoadedImage } from "@/lib/image";
import { AUTO_DETECT, getLanguage, languageName } from "@/lib/languages";
import { setPreferredTarget, usePreferredTarget } from "@/lib/preferences";
import { tesseractOcr } from "@/lib/services/ocr/tesseract";
import {
  extractText,
  segmentText,
  translateTexts,
  type Extraction,
  type PipelineProgress,
} from "@/lib/services/pipeline";
import { apiTranslationService } from "@/lib/services/translation/client";
import { ErrorBanner } from "./ErrorBanner";
import { ImagePanel } from "./ImagePanel";
import { LanguageSelect } from "./LanguageSelect";
import { ProgressIndicator } from "./ProgressIndicator";
import { RecentScans } from "./RecentScans";
import { UploadZone } from "./UploadZone";

type Stage = "idle" | "ready" | "reading" | "translating" | "done";

interface TranslationResult {
  /** Object URL of the full-resolution translated image, or a stored preview when reopened from history. */
  imageUrl: string;
  blob?: Blob;
  target: string;
  requestedSource: string;
  detectedSource?: string;
  lowConfidence: boolean;
  fromHistory?: boolean;
  title: string;
}

export function Translator() {
  const target = usePreferredTarget();
  const [stage, setStage] = useState<Stage>("idle");
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [source, setSource] = useState(AUTO_DETECT);
  const [extraction, setExtraction] = useState<Extraction | null>(null);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [progress, setProgress] = useState<PipelineProgress>({ label: "", value: 0 });
  const [error, setError] = useState<AppError | null>(null);

  const runRef = useRef(0);
  const translateButtonRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const busy = stage === "reading" || stage === "translating";

  // Revoke the previous translated image's object URL whenever it's replaced.
  useEffect(() => {
    const url = result?.imageUrl;
    return () => {
      if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
    };
  }, [result?.imageUrl]);

  const resetWorkspace = useCallback(() => {
    runRef.current++; // invalidate any in-flight run
    setImage((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    });
    setExtraction(null);
    setResult(null);
    setStage("idle");
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      try {
        validateImageFile(file);
        const loaded = await loadImage(file);
        resetWorkspace();
        setImage(loaded);
        setStage("ready");
        requestAnimationFrame(() => {
          rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          translateButtonRef.current?.focus({ preventScroll: true });
        });
      } catch (err) {
        setError(toAppError(err, "IMAGE_UNREADABLE"));
      }
    },
    [resetWorkspace],
  );

  // Paste an image from anywhere on the page.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const file = Array.from(e.clipboardData?.files ?? []).find((f) => f.type.startsWith("image/"));
      if (!file || busy) return;
      e.preventDefault();
      handleFile(file);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [busy, handleFile]);

  // Release the OCR worker's memory when leaving the page.
  useEffect(() => () => void tesseractOcr.dispose?.(), []);

  async function run() {
    if (busy || !image) return;
    const runId = ++runRef.current;
    const isCurrent = () => runRef.current === runId;
    const nextTarget = target;
    setError(null);

    let ex = extraction;
    let phase: "reading" | "translating" = "reading";

    try {
      // Read the image only when needed: first run, or a different source language.
      if (!ex || ex.requestedSource !== source) {
        setStage("reading");
        setProgress({ label: "Preparing image…", value: 0 });
        ex = await extractText(image, source, tesseractOcr, (p) => isCurrent() && setProgress(p));
        if (!isCurrent()) return;
        setExtraction(ex);
      }

      const translationSource = source !== AUTO_DETECT ? source : (ex.detectedSource ?? AUTO_DETECT);

      phase = "translating";
      setStage("translating");
      setProgress({ label: `Translating into ${languageName(nextTarget)}…`, value: 0 });
      const res = await translateTexts(
        ex.segments.map(segmentText),
        translationSource,
        nextTarget,
        apiTranslationService,
      );
      if (!isCurrent()) return;

      setProgress({ label: "Placing the translation on your image…", value: 1 });
      const { blob, preview } = await renderTranslatedImage(image, ex.segments, res.translations, nextTarget);
      if (!isCurrent()) return;

      const detectedSource =
        source !== AUTO_DETECT
          ? undefined
          : translationSource !== AUTO_DETECT
            ? translationSource
            : getLanguage(res.detectedSource)?.code;

      const title = scanTitle(image.name);
      setResult({
        imageUrl: URL.createObjectURL(blob),
        blob,
        target: nextTarget,
        requestedSource: source,
        detectedSource,
        lowConfidence: ex.lowConfidence,
        title,
      });
      setStage("done");

      addScan({
        id: crypto.randomUUID(),
        title,
        createdAt: Date.now(),
        sourceLang: source,
        detectedLang: detectedSource,
        targetLang: nextTarget,
        preview,
      });

      requestAnimationFrame(() => rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (err) {
      if (!isCurrent() || (err as Error).name === "AbortError") return;
      setError(toAppError(err, phase === "translating" ? "TRANSLATION_FAILED" : "OCR_FAILED"));
      setStage(result ? "done" : "ready");
    }
  }

  function openFromHistory(record: ScanRecord) {
    resetWorkspace();
    setError(null);
    if (!record.preview) {
      setError(new AppError("IMAGE_UNREADABLE", "The preview for this scan is no longer available."));
      return;
    }
    setSource(record.sourceLang);
    setResult({
      imageUrl: record.preview,
      target: record.targetLang,
      requestedSource: record.sourceLang,
      detectedSource: record.detectedLang,
      lowConfidence: false,
      fromHistory: true,
      title: record.title,
    });
    setStage("done");
    requestAnimationFrame(() => rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  async function download() {
    if (!result) return;
    const name = `${baseFilename(image?.name ?? result.title)}-${result.target}`;
    if (result.blob) {
      downloadBlob(result.blob, `${name}.png`);
    } else {
      const blob = await (await fetch(result.imageUrl)).blob();
      downloadBlob(blob, `${name}-preview.jpg`);
    }
  }

  const showWorkspace = stage !== "idle";
  const upToDate = !!result && result.target === target && result.requestedSource === source;
  const fromLabel =
    result?.requestedSource && result.requestedSource !== AUTO_DETECT
      ? languageName(result.requestedSource)
      : result?.detectedSource
        ? `${languageName(result.detectedSource)} (detected)`
        : "Auto-detected";

  return (
    <div ref={rootRef} id="translate" className="scroll-mt-24 space-y-6">
      {error && <ErrorBanner error={error} onDismiss={() => setError(null)} />}

      {!showWorkspace ? (
        <UploadZone
          onFile={handleFile}
          onPasteUnavailable={() =>
            setError(
              new AppError(
                "UNSUPPORTED_FILE",
                "No image found on your clipboard. Copy an image first, or allow clipboard access when asked.",
              ),
            )
          }
        />
      ) : (
        <div className="grid animate-fade-up gap-4 text-left lg:grid-cols-[1.4fr_1fr]">
          <ImagePanel
            original={image ?? undefined}
            translatedUrl={result?.imageUrl}
            title={result?.title}
            busy={busy}
            onReplace={handleFile}
            onRemove={resetWorkspace}
          />

          <section aria-label="Translation settings" className={`${card} flex flex-col gap-5 p-5 sm:p-6`}>
            {result ? (
              <div aria-live="polite">
                <p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
                  <CircleCheck className="size-4" aria-hidden="true" />
                  Translation complete
                </p>
                <p className="mt-3 text-sm text-ink-soft">
                  {fromLabel} <ArrowRight className="inline size-3.5" aria-hidden="true" />{" "}
                  <strong className="text-ink">{languageName(result.target)}</strong>
                </p>
                <button type="button" onClick={download} className={`${btn.primary} mt-4 w-full`}>
                  <ImageDown className="size-5" aria-hidden="true" />
                  {result.blob ? "Download Translated Image" : "Download Preview"}
                </button>
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-bold text-ink">Translate this image</h2>
                <p className="mt-0.5 text-sm text-ink-muted">
                  We&apos;ll replace the text in your image with the translation.
                </p>
              </div>
            )}

            {result?.fromHistory ? (
              <p className="flex gap-2 rounded-xl bg-surface p-3 text-sm leading-relaxed text-ink-soft">
                <Info className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden="true" />
                Opened from Recent Scans. Only a small preview is saved in your browser — upload the image again to
                translate it into another language or get the full-resolution version.
              </p>
            ) : (
              <>
                {result && <hr className="border-line" />}
                {result && <p className="-mb-2 text-sm font-semibold text-ink">Translate into another language</p>}
                <LanguageSelect
                  id="source-language"
                  label="Source Language"
                  value={source}
                  onChange={setSource}
                  includeAuto
                  disabled={busy}
                />
                <LanguageSelect
                  id="target-language"
                  label="Translate To"
                  value={target}
                  onChange={setPreferredTarget}
                  disabled={busy}
                />

                {source === AUTO_DETECT && (
                  <p className="flex gap-2 rounded-xl bg-surface p-3 text-xs leading-relaxed text-ink-soft">
                    <Info className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden="true" />
                    Auto Detect works best for Latin-script languages. For Arabic, Chinese, Japanese, Hindi and other
                    scripts, pick the source language for accurate results.
                  </p>
                )}

                {result?.lowConfidence && (
                  <p className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    Some text may not have been recognised accurately. If it isn&apos;t in a Latin script, choose its
                    language under Source Language and translate again.
                  </p>
                )}

                <div className="mt-auto space-y-4">
                  {busy && <ProgressIndicator stage={stage} label={progress.label} value={progress.value} />}
                  <button
                    ref={translateButtonRef}
                    type="button"
                    onClick={run}
                    disabled={busy || upToDate}
                    className={`${result ? btn.secondary : btn.primary} w-full py-3.5 text-base`}
                  >
                    {busy ? (
                      <>
                        <span
                          className="size-4 animate-spin rounded-full border-2 border-current/30 border-t-current"
                          aria-hidden="true"
                        />
                        {stage === "reading" ? "Reading text…" : "Translating…"}
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-5" aria-hidden="true" />
                        {result ? "Translate Again" : "Translate Now"}
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </>
                    )}
                  </button>
                  {upToDate && !busy && (
                    <p className="-mt-2 text-center text-xs text-ink-muted">
                      Pick a different language to translate again.
                    </p>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      )}

      <RecentScans onOpen={openFromHistory} />
    </div>
  );
}
