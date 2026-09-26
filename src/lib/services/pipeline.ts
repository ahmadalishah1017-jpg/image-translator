import { franc } from "franc-min";
import { AppError, toAppError } from "@/lib/errors";
import { prepareForOcr, scaleBox, type LoadedImage } from "@/lib/image";
import { AUTO_DETECT, getLanguage, languageFromIso3, languageName, ocrLangsFor } from "@/lib/languages";
import type { OcrProvider, TextSegment } from "./ocr/types";
import { NO_SPACE_SCRIPT } from "./text";
import { TRANSLATION_LIMITS, type TranslationService } from "./translation/types";

/**
 * OCR Service → Extracted Text → Translation Service → Translated Text
 *
 * The pipeline only depends on the `OcrProvider` and `TranslationService` interfaces,
 * so either side can be swapped for another provider.
 */

export interface Extraction {
  /** Segments in original-image pixel coordinates. */
  segments: TextSegment[];
  confidence: number;
  /** The source option the user picked ("auto" or a code). */
  requestedSource: string;
  /** Detected language when the user picked Auto Detect and detection succeeded. */
  detectedSource?: string;
  /** Low confidence usually means a script the current OCR model can't read. */
  lowConfidence: boolean;
}

export interface PipelineProgress {
  label: string;
  /** 0–1 */
  value: number;
}

/** Text of a segment as a single paragraph (the form sent for translation). */
export function segmentText(segment: TextSegment): string {
  return segment.lines.join(segment.lines.some((l) => NO_SPACE_SCRIPT.test(l)) ? "" : " ");
}

export function detectLanguage(text: string): string | undefined {
  const iso3 = franc(text, { minLength: 16 });
  return iso3 === "und" ? undefined : languageFromIso3(iso3)?.code;
}

export async function extractText(
  image: LoadedImage,
  source: string,
  ocr: OcrProvider,
  onProgress: (p: PipelineProgress) => void,
): Promise<Extraction> {
  const { canvas, scale } = prepareForOcr(image);

  const run = async (languages: string, label: string) => {
    try {
      return await ocr.recognize(canvas, languages, (stage, value) =>
        onProgress({
          label: stage === "loading" ? "Loading OCR model…" : label,
          value: stage === "loading" ? value * 0.2 : 0.2 + value * 0.8,
        }),
      );
    } catch (err) {
      throw toAppError(err, "OCR_FAILED");
    }
  };

  let detectedSource: string | undefined;
  let result;

  if (source === AUTO_DETECT) {
    // Pass 1: Latin-script model, then detect the language from the text.
    result = await run("eng", "Reading text…");
    detectedSource = detectLanguage(result.segments.map(segmentText).join(" "));
    const detected = getLanguage(detectedSource);
    // Pass 2: re-read with the detected language's model for accents/special characters.
    if (detected?.ocr && detected.ocr !== "eng") {
      const refined = await run(ocrLangsFor(detected.code), `Refining for ${languageName(detected.code)}…`);
      if (refined.segments.length && refined.confidence >= result.confidence - 5) result = refined;
    }
  } else {
    result = await run(ocrLangsFor(source), "Reading text…");
  }

  if (!result.segments.length) throw new AppError("NO_TEXT");

  const segments = result.segments.map((s) => ({
    ...s,
    bbox: scaleBox(s.bbox, 1 / scale),
    lineBoxes: s.lineBoxes.map((b) => scaleBox(b, 1 / scale)),
  }));

  return {
    segments,
    confidence: result.confidence,
    requestedSource: source,
    detectedSource,
    lowConfidence: result.confidence < 55,
  };
}

export async function translateTexts(
  texts: string[],
  source: string,
  target: string,
  service: TranslationService,
  signal?: AbortSignal,
): Promise<{ translations: string[]; detectedSource?: string }> {
  const total = texts.reduce((n, t) => n + t.length, 0);
  if (texts.length > TRANSLATION_LIMITS.maxSegments || total > TRANSLATION_LIMITS.maxTotalChars) {
    throw new AppError("TEXT_TOO_LONG");
  }
  if (source !== AUTO_DETECT && source === target) {
    return { translations: [...texts], detectedSource: source };
  }
  try {
    const res = await service.translate({ texts, source, target }, signal);
    return { translations: res.translations, detectedSource: res.detectedSource };
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw toAppError(err, "TRANSLATION_FAILED");
  }
}
