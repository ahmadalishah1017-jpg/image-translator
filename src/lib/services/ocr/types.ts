export interface BoundingBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** A translatable unit of recognized text (a heading, list item, or wrapped sentence) and where it sits. */
export interface TextSegment {
  lines: string[];
  bbox: BoundingBox;
  /** Bounding boxes of the individual lines, used to estimate font size. */
  lineBoxes: BoundingBox[];
  confidence: number;
}

export interface OcrResult {
  segments: TextSegment[];
  /** Mean confidence (0–100) across segments. */
  confidence: number;
  /** Tesseract language string used, e.g. "spa+eng". */
  languages: string;
}

export type OcrStage = "loading" | "recognizing";

export type OcrProgressHandler = (stage: OcrStage, progress: number) => void;

/**
 * Any OCR engine can be plugged in by implementing this interface —
 * e.g. a cloud OCR API called through a server route.
 */
export interface OcrProvider {
  readonly name: string;
  recognize(
    image: HTMLCanvasElement,
    languages: string,
    onProgress?: OcrProgressHandler,
  ): Promise<OcrResult>;
  dispose?(): Promise<void>;
}
