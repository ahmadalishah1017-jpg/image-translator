import type { Worker } from "tesseract.js";
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

export const tesseractOcr: OcrProvider = {
  name: "tesseract",

  async recognize(image, languages, onProgress): Promise<OcrResult> {
    progressHandler = onProgress;
    try {
      const worker = await getWorker(languages);
      const { data } = await worker.recognize(image, {}, { text: true, blocks: true });

      const paragraphs = (data.blocks ?? []).flatMap((b) => b.paragraphs);
      const allBoxes = paragraphs.flatMap((p) => p.lines.map((l) => l.bbox));

      const segments: TextSegment[] = [];
      let paragraphIndex = 0;
      for (const paragraph of paragraphs) {
        // Drop noise: lines with no letters/digits, low confidence (often hallucinated from
        // textures/edges), or diacritics misread as a separate line inside a taller line.
        const lines = paragraph.lines
          .map((l) => ({ ...l, text: normalizeOcrLine(l.text) }))
          .filter(
            (l) => HAS_CONTENT.test(l.text) && l.confidence >= 45 && !isInsideTallerLine(l.bbox, allBoxes),
          );
        if (!lines.length) continue;

        const groups = groupLines(
          lines.map((l) => l.text),
          lines.map((l) => l.bbox.y1 - l.bbox.y0),
        );
        for (const group of groups) {
          const members = group.map((i) => lines[i]);
          segments.push({
            lines: members.map((l) => l.text),
            paragraph: paragraphIndex,
            bbox: unionBox(members.map((l) => l.bbox)),
            lineBoxes: members.map((l) => l.bbox),
            confidence: members.reduce((s, l) => s + l.confidence, 0) / members.length,
          });
        }
        paragraphIndex++;
      }

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
