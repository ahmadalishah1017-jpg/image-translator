"use client";

import { ArrowRight, ImagePlus, Info, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { btn, card } from "@/components/ui";
import { baseFilename, downloadBlob } from "@/lib/download";
import { AppError, toAppError } from "@/lib/errors";
import { addScan, scanTitle, type ScanRecord } from "@/lib/history";
import {
  loadImage,
  makeThumbnail,
  renderTextCard,
  renderTranslatedImage,
  validateImageFile,
  type LoadedImage,
} from "@/lib/image";
import { AUTO_DETECT, getLanguage, languageName } from "@/lib/languages";
import { setPreferredTarget, usePreferredTarget } from "@/lib/preferences";
import { tesseractOcr } from "@/lib/services/ocr/tesseract";
import type { TextSegment } from "@/lib/services/ocr/types";
import {
  detectLanguage,
  extractText,
  segmentsToText,
  segmentText,
  joinUnits,
  textToUnits,
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
import { ResultsPanel } from "./ResultsPanel";
import { UploadZone } from "./UploadZone";

type Stage = "idle" | "ready" | "extracting" | "translating" | "done";

interface TranslationResult {
  /** One entry per translated unit (aligned with `segments` when present). */
  translations: string[];
  translatedText: string;
  target: string;
  requestedSource: string;
  detectedSource?: string;
  originalText: string;
  /** Present when the translation maps 1:1 onto OCR segments, enabling the image overlay. */
  segments?: TextSegment[];
  lowConfidence: boolean;
}

interface HistorySnapshot {
  thumbnail?: string;
  title: string;
}

export function Translator() {
  const target = usePreferredTarget();
  const [stage, setStage] = useState<Stage>("idle");
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [historySnapshot, setHistorySnapshot] = useState<HistorySnapshot | null>(null);
  const [source, setSource] = useState(AUTO_DETECT);
  const [extraction, setExtraction] = useState<Extraction | null>(null);
  const [originalText, setOriginalText] = useState("");
  const [edited, setEdited] = useState(false);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [progress, setProgress] = useState<PipelineProgress>({ label: "", value: 0 });
  const [error, setError] = useState<AppError | null>(null);

  const runRef = useRef(0);
  const thumbnailRef = useRef<string | undefined>(undefined);
  const translateButtonRef = useRef<HTMLButtonElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const busy = stage === "extracting" || stage === "translating";

  const resetWorkspace = useCallback(() => {
    runRef.current++; // invalidate any in-flight run
    setImage((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    });
    thumbnailRef.current = undefined;
    setHistorySnapshot(null);
    setExtraction(null);
    setOriginalText("");
    setEdited(false);
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

  // Release the worker's memory when leaving the page.
  useEffect(() => () => void tesseractOcr.dispose?.(), []);

  async function run(nextTarget = target) {
    if (busy) return;
    const runId = ++runRef.current;
    const isCurrent = () => runRef.current === runId;
    setError(null);

    let ex = extraction;
    let text = originalText;
    let isEdited = edited;
    let phase: "extracting" | "translating" = "extracting";

    try {
      // OCR only when needed: new image, or a different source language (and the text wasn't hand-edited).
      if (image && !isEdited && (!ex || ex.requestedSource !== source)) {
        setStage("extracting");
        setProgress({ label: "Preparing image…", value: 0 });
        ex = await extractText(image, source, tesseractOcr, (p) => isCurrent() && setProgress(p));
        if (!isCurrent()) return;
        text = segmentsToText(ex.segments);
        isEdited = false;
        setExtraction(ex);
        setOriginalText(text);
        setEdited(false);
      }

      const fromSegments = Boolean(image && ex && !isEdited);
      const units = fromSegments
        ? ex!.segments.map((s) => ({ text: segmentText(s), paragraph: s.paragraph }))
        : textToUnits(text);
      const texts = units.map((u) => u.text);
      if (!texts.length) throw new AppError("NO_TEXT");

      const translationSource =
        source !== AUTO_DETECT ? source : (ex?.detectedSource ?? detectLanguage(text) ?? AUTO_DETECT);

      phase = "translating";
      setStage("translating");
      setProgress({ label: `Translating into ${languageName(nextTarget)}…`, value: 0 });
      const res = await translateTexts(texts, translationSource, nextTarget, apiTranslationService);
      if (!isCurrent()) return;

      const detectedSource =
        source !== AUTO_DETECT
          ? undefined
          : translationSource !== AUTO_DETECT
            ? translationSource
            : getLanguage(res.detectedSource)?.code;

      const next: TranslationResult = {
        translations: res.translations,
        translatedText: joinUnits(res.translations, units.map((u) => u.paragraph)),
        target: nextTarget,
        requestedSource: source,
        detectedSource,
        originalText: text,
        segments: fromSegments ? ex!.segments : undefined,
        lowConfidence: fromSegments && Boolean(ex?.lowConfidence),
      };
      setResult(next);
      setStage("done");

      if (image && !thumbnailRef.current) thumbnailRef.current = makeThumbnail(image);
      addScan({
        id: crypto.randomUUID(),
        title: scanTitle(text, historySnapshot?.title ?? baseFilename(image?.name ?? "Scan")),
        createdAt: Date.now(),
        sourceLang: source,
        detectedLang: detectedSource,
        targetLang: nextTarget,
        originalText: text,
        translatedText: next.translatedText,
        thumbnail: thumbnailRef.current ?? historySnapshot?.thumbnail,
      });

      requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        resultsRef.current?.focus({ preventScroll: true });
      });
    } catch (err) {
      if (!isCurrent() || (err as Error).name === "AbortError") return;
      setError(toAppError(err, phase === "translating" ? "TRANSLATION_FAILED" : "OCR_FAILED"));
      setStage(result ? "done" : image ? "ready" : "done");
    }
  }

  function openFromHistory(record: ScanRecord) {
    resetWorkspace();
    setError(null);
    setHistorySnapshot({ thumbnail: record.thumbnail, title: record.title });
    setSource(record.sourceLang);
    setPreferredTarget(record.targetLang);
    setOriginalText(record.originalText);
    setResult({
      translations: [record.translatedText],
      translatedText: record.translatedText,
      target: record.targetLang,
      requestedSource: record.sourceLang,
      detectedSource: record.detectedLang,
      originalText: record.originalText,
      lowConfidence: false,
    });
    setStage("done");
    requestAnimationFrame(() => rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  async function downloadImage() {
    if (!result) return;
    const name = baseFilename(image?.name ?? result.originalText.slice(0, 30));
    try {
      const blob =
        image && result.segments
          ? await renderTranslatedImage(image, result.segments, result.translations, result.target)
          : await renderTextCard(result.translatedText, result.target, `${languageName(result.target)} translation`);
      downloadBlob(blob, `${name}-${result.target}.png`);
    } catch {
      setError(new AppError("IMAGE_UNREADABLE", "We couldn't create the image. Download the translation as text instead."));
    }
  }

  const showWorkspace = stage !== "idle";
  const stale =
    !!result &&
    !busy &&
    (result.target !== target || result.requestedSource !== source || result.originalText !== originalText);

  const sourceLabel =
    result?.requestedSource && result.requestedSource !== AUTO_DETECT
      ? languageName(result.requestedSource)
      : result?.detectedSource
        ? `Detected: ${languageName(result.detectedSource)}`
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
        <div className="grid animate-fade-up gap-4 text-left lg:grid-cols-[1.15fr_1fr]">
          {image ? (
            <ImagePanel image={image} busy={busy} onReplace={handleFile} onRemove={resetWorkspace} />
          ) : (
            <section aria-label="Saved scan" className={`${card} flex flex-col items-center justify-center gap-4 p-8 text-center`}>
              {historySnapshot?.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={historySnapshot.thumbnail} alt="" className="max-h-40 rounded-xl border border-line shadow-card" />
              ) : (
                <ImagePlus className="size-10 text-ink-muted" aria-hidden="true" />
              )}
              <p className="max-w-sm text-sm text-ink-soft">
                Opened from Recent Scans. The original image isn&apos;t stored, but you can translate the text into
                other languages.
              </p>
              <button type="button" className={btn.secondary} onClick={resetWorkspace}>
                <ImagePlus className="size-4" aria-hidden="true" />
                Upload a new image
              </button>
            </section>
          )}

          <section aria-label="Translation settings" className={`${card} flex flex-col gap-5 p-5 sm:p-6`}>
            <div>
              <h2 className="text-lg font-bold text-ink">Translation</h2>
              <p className="mt-0.5 text-sm text-ink-muted">We&apos;ll extract the text and translate it in one step.</p>
            </div>

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

            {source === AUTO_DETECT && image && (
              <p className="flex gap-2 rounded-xl bg-surface p-3 text-xs leading-relaxed text-ink-soft">
                <Info className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden="true" />
                Auto Detect works best for Latin-script languages. For Arabic, Chinese, Japanese, Hindi and other
                scripts, pick the source language for accurate text recognition.
              </p>
            )}

            <div className="mt-auto space-y-4">
              {busy && <ProgressIndicator stage={stage} label={progress.label} value={progress.value} />}
              <button
                ref={translateButtonRef}
                type="button"
                onClick={() => run()}
                disabled={busy}
                className={`${btn.primary} w-full py-3.5 text-base`}
              >
                {busy ? (
                  <>
                    <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
                    {stage === "extracting" ? "Extracting text…" : "Translating…"}
                  </>
                ) : (
                  <>
                    <Sparkles className="size-5" aria-hidden="true" />
                    Translate Now
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      )}

      {result && (
        <ResultsPanel
          ref={resultsRef}
          key={result.originalText + result.target}
          originalText={originalText}
          sourceLabel={sourceLabel}
          sourceCode={result.requestedSource !== AUTO_DETECT ? result.requestedSource : result.detectedSource}
          onOriginalCommit={(text) => {
            setOriginalText(text);
            setEdited(true);
          }}
          edited={edited}
          translatedText={result.translatedText}
          target={result.target}
          selectedTarget={target}
          onTargetChange={setPreferredTarget}
          onTranslateAgain={() => run()}
          onDownloadImage={downloadImage}
          canOverlay={Boolean(image && result.segments)}
          busy={busy}
          filenameBase={baseFilename(image?.name ?? historySnapshot?.title ?? "translation")}
          lowConfidence={result.lowConfidence}
          stale={stale}
        />
      )}

      <RecentScans onOpen={openFromHistory} />
    </div>
  );
}
