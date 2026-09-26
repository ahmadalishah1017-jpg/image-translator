import type { Page, PSM, Word, Worker, WorkerParams } from "tesseract.js";
import { groupLines, normalizeOcrLine } from "../text";
import type { BoundingBox, OcrProgressHandler, OcrProvider, OcrResult, TextSegment } from "./types";

/**
 * In-browser OCR with Tesseract.js. Images never leave the device —
 * only the OCR engine and language model files are downloaded (and cached by the browser).
 */

let workerPromise: Promise<Worker> | null = null;
let loadedLanguages: string | null = null;
let progressHandler: OcrProgressHandler | undefined;

function handleLog(message: { status: string; progress: number }) {
  if (!progressHandler) return;
  if (message.status === "recognizing text") {
    progressHandler("recognizing", message.progress);
  } else {
    progressHandler("loading", message.progress);
  }
}

async function getWorker(languages: string): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = import("tesseract.js").then(({ createWorker }) =>
      createWorker(languages, 1, { logger: handleLog }),
    );
    loadedLanguages = languages;
    try {
      return await workerPromise;
    } catch (err) {
      workerPromise = null;
      loadedLanguages = null;
      throw err;
    }
  }
  const worker = await workerPromise;
  if (loadedLanguages !== languages) {
    await worker.reinitialize(languages, 1);
    loadedLanguages = languages;
  }
  return worker;
}

// Page segmentation modes (see Tesseract PSM docs).
const PSM_AUTO = "3" as PSM;
const PSM_SPARSE = "11" as PSM;
// Binarisation: 0 = global (Otsu), 2 = local adaptive (Sauvola).
const GLOBAL = "0";
const LOCAL = "2";

function invert(source: HTMLCanvasElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(source, 0, 0);
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < img.data.length; i += 4) {
    img.data[i] = 255 - img.data[i];
    img.data[i + 1] = 255 - img.data[i + 1];
    img.data[i + 2] = 255 - img.data[i + 2];
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

// Words made only of these characters are usually borders of shapes, not text.
const LINE_ART = /^[|¦_—–=~/\\()[\]{}-]+$/;

const HAS_CONTENT = /[\p{L}\p{N}]/u;

function unionBox(boxes: BoundingBox[]): BoundingBox {
  return {
    x0: Math.min(...boxes.map((b) => b.x0)),
    y0: Math.min(...boxes.map((b) => b.y0)),
    x1: Math.max(...boxes.map((b) => b.x1)),
    y1: Math.max(...boxes.map((b) => b.y1)),
  };
}

function isInsideTallerLine(box: BoundingBox, others: BoundingBox[]): boolean {
  const h = box.y1 - box.y0;
  return others.some((o) => {
    if (o === box || o.y1 - o.y0 < h * 1.2) return false;
    const vOverlap = Math.min(box.y1, o.y1) - Math.max(box.y0, o.y0);
    const hOverlap = Math.min(box.x1, o.x1) - Math.max(box.x0, o.x0);
    return vOverlap >= h * 0.5 && hOverlap > (box.x1 - box.x0) * 0.5;
  });
}

/** One run of text on a single row, plus the OCR paragraph it came from. */
interface RawLine {
  text: string;
  bbox: BoundingBox;
  confidence: number;
  paragraph: number;
  /** True when this run was cut out of a longer OCR line at a wide gap. */
  split: boolean;
}

/**
 * Turn OCR output into rows of text. A single OCR "line" often joins separate pieces of text
 * that merely sit on the same row (e.g. "Opening hours" on the left and "Closed Sundays" on
 * the right), so lines are cut wherever the gap between words is much wider than a space.
 */
function collectLines(page: Page, paragraphOffset: number): RawLine[] {
  const out: RawLine[] = [];
  const paragraphs = (page.blocks ?? []).flatMap((b) => b.paragraphs);
  paragraphs.forEach((paragraph, p) => {
    for (const line of paragraph.lines) {
      // Skip line-art "words" (edges of boxes and shapes misread as | — _ =).
      const words = line.words.filter((w) => w.text.trim() && !LINE_ART.test(w.text.trim()));
      if (!words.length) continue;
      const height = line.bbox.y1 - line.bbox.y0;
      const runs: Word[][] = [[words[0]]];
      for (let i = 1; i < words.length; i++) {
        const gap = words[i].bbox.x0 - words[i - 1].bbox.x1;
        if (gap > height * 1.5) runs.push([words[i]]);
        else runs[runs.length - 1].push(words[i]);
      }
      for (const run of runs) {
        // Word boxes can be too tall (notably for CJK) and line boxes can swallow nearby shapes
        // (e.g. a tag border), but the area where both agree is reliable.
        const words = unionBox(trimTallWords(run.map((w) => w.bbox)));
        const y0 = Math.max(words.y0, line.bbox.y0);
        const y1 = Math.min(words.y1, line.bbox.y1);
        const bbox = y1 > y0 ? { x0: words.x0, x1: words.x1, y0, y1 } : words;
        out.push({
          text: normalizeOcrLine(run.map((w) => w.text).join(" ")),
          bbox,
          confidence: run.reduce((s, w) => s + w.confidence, 0) / run.length,
          paragraph: paragraphOffset + p,
          split: runs.length > 1,
        });
      }
    }
  });
  return out;
}

/**
 * A word box sometimes swallows part of a nearby shape (e.g. the border of a price tag),
 * making it far taller than the other words on its line. Clamp such boxes to the line's
 * normal vertical extent so the font size and erase area aren't inflated.
 */
function trimTallWords(boxes: BoundingBox[]): BoundingBox[] {
  if (boxes.length < 2) return boxes;
  const heights = boxes.map((b) => b.y1 - b.y0).sort((a, b) => a - b);
  const typical = heights[Math.floor(heights.length / 2)];
  const normal = boxes.filter((b) => b.y1 - b.y0 <= typical * 1.5);
  if (!normal.length || normal.length === boxes.length) return boxes;
  const y0 = Math.min(...normal.map((b) => b.y0));
  const y1 = Math.max(...normal.map((b) => b.y1));
  return boxes.map((b) => (b.y1 - b.y0 > typical * 1.5 ? { ...b, y0: Math.max(b.y0, y0), y1: Math.min(b.y1, y1) } : b));
}

function overlapRatio(a: BoundingBox, b: BoundingBox): number {
  const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
  const h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
  if (w <= 0 || h <= 0) return 0;
  const smaller = Math.min((a.x1 - a.x0) * (a.y1 - a.y0), (b.x1 - b.x0) * (b.y1 - b.y0));
  return (w * h) / smaller;
}

export const tesseractOcr: OcrProvider = {
  name: "tesseract",

  async recognize(image, languages, onProgress): Promise<OcrResult> {
    try {
      const worker = await getWorker(languages);

      const pass = async (source: HTMLCanvasElement, from: number, to: number, params: Partial<WorkerParams>) => {
        progressHandler = (stage, v) => onProgress?.(stage, stage === "loading" ? v : from + v * (to - from));
        await worker.setParameters(params);
        return (await worker.recognize(source, {}, { blocks: true })).data;
      };

      // Pass 1: normal page layout analysis — paragraphs, columns and reading order.
      const layout = await pass(image, 0, 0.5, { tessedit_pageseg_mode: PSM_AUTO, thresholding_method: GLOBAL });
      // Pass 2: sparse text with local (Sauvola) thresholding — finds scattered text and text
      // inside coloured shapes (badges, labels, price tags) that the layout pass treats as pictures.
      const sparse = await pass(image, 0.5, 0.8, { tessedit_pageseg_mode: PSM_SPARSE, thresholding_method: LOCAL });
      // Pass 3: the same on an inverted copy — catches light text on dark shapes.
      const inverted = await pass(invert(image), 0.8, 1, {
        tessedit_pageseg_mode: PSM_SPARSE,
        thresholding_method: LOCAL,
      });
      await worker.setParameters({ tessedit_pageseg_mode: PSM_AUTO, thresholding_method: GLOBAL });

      const isText = (l: RawLine, minConfidence: number) => HAS_CONTENT.test(l.text) && l.confidence >= minConfidence;
      const lines = collectLines(layout, 0).filter((l) => isText(l, 45));
      const extras = [...collectLines(sparse, 100_000), ...collectLines(inverted, 200_000)];
      for (const extra of extras.filter((l) => isText(l, 60))) {
        if (!lines.some((l) => overlapRatio(l.bbox, extra.bbox) > 0.3)) lines.push(extra);
      }

      // Drop diacritics misread as a separate line inside a taller line.
      const boxes = lines.map((l) => l.bbox);
      const kept = lines.filter((l) => !isInsideTallerLine(l.bbox, boxes));

      // Group rows of the same paragraph into translatable units. Paragraphs that had to be cut
      // into pieces are side-by-side items, so each piece stays on its own.
      const byParagraph = new Map<number, RawLine[]>();
      for (const l of kept) byParagraph.set(l.paragraph, [...(byParagraph.get(l.paragraph) ?? []), l]);

      const segments: TextSegment[] = [];
      for (const group of byParagraph.values()) {
        const units = group.some((l) => l.split)
          ? group.map((_, i) => [i])
          : groupLines(
              group.map((l) => l.text),
              group.map((l) => l.bbox.y1 - l.bbox.y0),
            );
        for (const unit of units) {
          const members = unit.map((i) => group[i]);
          segments.push({
            lines: members.map((l) => l.text),
            bbox: unionBox(members.map((l) => l.bbox)),
            lineBoxes: members.map((l) => l.bbox),
            confidence: members.reduce((s, l) => s + l.confidence, 0) / members.length,
          });
        }
      }
      // Reading order: top to bottom, then left to right.
      segments.sort((a, b) => a.bbox.y0 - b.bbox.y0 || a.bbox.x0 - b.bbox.x0);

      const confidence = segments.length
        ? segments.reduce((sum, s) => sum + s.confidence, 0) / segments.length
        : 0;

      return { segments, confidence, languages };
    } finally {
      progressHandler = undefined;
    }
  },


  async dispose() {
    if (!workerPromise) return;
    const worker = await workerPromise;
    workerPromise = null;
    loadedLanguages = null;
    await worker.terminate();
  },
};
