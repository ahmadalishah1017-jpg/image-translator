import { AppError } from "./errors";
import { isRtl } from "./languages";
import type { BoundingBox, TextSegment } from "./services/ocr/types";

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const ACCEPT_ATTRIBUTE = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export interface LoadedImage {
  element: HTMLImageElement;
  url: string;
  name: string;
  width: number;
  height: number;
}

export function validateImageFile(file: File): void {
  if (!(ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
    throw new AppError("UNSUPPORTED_FILE");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new AppError("FILE_TOO_LARGE");
  }
}

export function loadImage(file: File): Promise<LoadedImage> {
  const url = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const element = new Image();
    element.onload = () =>
      resolve({
        element,
        url,
        name: file.name || "pasted-image",
        width: element.naturalWidth,
        height: element.naturalHeight,
      });
    element.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new AppError("IMAGE_UNREADABLE"));
    };
    element.src = url;
  });
}

function createCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  return { canvas, ctx };
}

/**
 * Resize the image to a size OCR handles well: small screenshots are upscaled,
 * huge photos are downscaled for speed. Returns the scale relative to the original.
 */
export function prepareForOcr(image: LoadedImage): { canvas: HTMLCanvasElement; scale: number } {
  const longest = Math.max(image.width, image.height);
  let scale = 1;
  if (longest > 2600) scale = 2600 / longest;
  else if (longest < 1000) scale = Math.min(2, 1600 / longest);

  const { canvas, ctx } = createCanvas(image.width * scale, image.height * scale);
  ctx.fillStyle = "#fff"; // flatten transparency — dark text on transparent PNGs becomes readable
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image.element, 0, 0, canvas.width, canvas.height);
  return { canvas, scale };
}

export function scaleBox(box: BoundingBox, factor: number): BoundingBox {
  return { x0: box.x0 * factor, y0: box.y0 * factor, x1: box.x1 * factor, y1: box.y1 * factor };
}

export function makeThumbnail(image: LoadedImage, size = 160): string {
  const scale = Math.min(1, size / Math.max(image.width, image.height));
  const { canvas, ctx } = createCanvas(image.width * scale, image.height * scale);
  ctx.drawImage(image.element, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.7);
}

// ---------------------------------------------------------------------------
// Translated image rendering
// ---------------------------------------------------------------------------

type RGB = [number, number, number];

const luminance = ([r, g, b]: RGB) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

/** Background = median colour of the pixels just outside the box edge. */
function sampleBackground(ctx: CanvasRenderingContext2D, box: BoundingBox): RGB {
  const { width, height } = ctx.canvas;
  const pad = 3;
  const x0 = Math.max(0, Math.floor(box.x0 - pad));
  const y0 = Math.max(0, Math.floor(box.y0 - pad));
  const x1 = Math.min(width - 1, Math.ceil(box.x1 + pad));
  const y1 = Math.min(height - 1, Math.ceil(box.y1 + pad));
  const w = x1 - x0 + 1;
  const h = y1 - y0 + 1;
  const data = ctx.getImageData(x0, y0, w, h).data;
  const rs: number[] = [];
  const gs: number[] = [];
  const bs: number[] = [];
  const push = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    rs.push(data[i]);
    gs.push(data[i + 1]);
    bs.push(data[i + 2]);
  };
  const step = Math.max(1, Math.floor(Math.max(w, h) / 200));
  for (let x = 0; x < w; x += step) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 0; y < h; y += step) {
    push(0, y);
    push(w - 1, y);
  }
  return [median(rs), median(gs), median(bs)];
}

/** Text colour = average of pixels inside the box that contrast strongly with the background. */
function sampleForeground(ctx: CanvasRenderingContext2D, box: BoundingBox, bg: RGB): RGB {
  const x0 = Math.max(0, Math.floor(box.x0));
  const y0 = Math.max(0, Math.floor(box.y0));
  const w = Math.max(1, Math.min(ctx.canvas.width - x0, Math.ceil(box.x1 - box.x0)));
  const h = Math.max(1, Math.min(ctx.canvas.height - y0, Math.ceil(box.y1 - box.y0)));
  const data = ctx.getImageData(x0, y0, w, h).data;
  const bgLum = luminance(bg);
  let r = 0, g = 0, b = 0, n = 0;
  const step = Math.max(1, Math.floor((w * h) / 20000)) * 4;
  for (let i = 0; i < data.length; i += step) {
    const px: RGB = [data[i], data[i + 1], data[i + 2]];
    if (Math.abs(luminance(px) - bgLum) > 90) {
      r += px[0];
      g += px[1];
      b += px[2];
      n++;
    }
  }
  if (n < 5) return bgLum > 128 ? [17, 24, 39] : [255, 255, 255];
  return [r / n, g / n, b / n];
}

const rgb = ([r, g, b]: RGB) => `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;

const FONT_STACK =
  '"Segoe UI", system-ui, -apple-system, "Noto Sans", "Noto Sans Arabic", "Noto Sans CJK SC", "Hiragino Sans", "Microsoft YaHei", sans-serif';

/** Languages written without spaces between words are wrapped per character. */
const NO_SPACE_SCRIPTS = /[぀-ヿ㐀-鿿가-힯฀-๿຀-໿က-႟ក-៿]/;

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const tokens = NO_SPACE_SCRIPTS.test(text) ? Array.from(text) : text.split(/(\s+)/);
  const lines: string[] = [];
  let current = "";
  for (const token of tokens) {
    const candidate = current + token;
    if (current && ctx.measureText(candidate.trimEnd()).width > maxWidth) {
      lines.push(current.trim());
      current = token.trimStart();
    } else {
      current = candidate;
    }
  }
  if (current.trim()) lines.push(current.trim());
  return lines;
}

function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  width: number,
  height: number,
  startSize: number,
) {
  let size = Math.max(8, Math.round(startSize));
  for (; size >= 8; size -= 1) {
    ctx.font = `500 ${size}px ${FONT_STACK}`;
    const lines = wrapText(ctx, text, width);
    const lineHeight = size * 1.2;
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
    if (lines.length * lineHeight <= height * 1.08 && widest <= width * 1.02) {
      return { size, lines, lineHeight };
    }
  }
  ctx.font = `500 8px ${FONT_STACK}`;
  return { size: 8, lines: wrapText(ctx, text, width), lineHeight: 8 * 1.2 };
}

/**
 * Paint each translated segment over the original text area, approximating the
 * original layout. Works best for documents, screenshots and signs with plain backgrounds.
 */
export async function renderTranslatedImage(
  image: LoadedImage,
  segments: TextSegment[],
  translations: string[],
  targetLang: string,
): Promise<Blob> {
  const maxSide = 4000;
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const { canvas, ctx } = createCanvas(image.width * scale, image.height * scale);
  ctx.drawImage(image.element, 0, 0, canvas.width, canvas.height);

  const rtl = isRtl(targetLang);
  const areas = segments.map((segment) => {
    const box = scaleBox(segment.bbox, scale);
    const bg = sampleBackground(ctx, box);
    const fg = sampleForeground(ctx, box, bg);
    const lineHeights = segment.lineBoxes.map((b) => (b.y1 - b.y0) * scale);
    return { box, bg, fg, lineHeight: median(lineHeights) || (box.y1 - box.y0) };
  });

  // Erase all original text first so overlapping boxes don't paint over new text.
  for (const { box, bg } of areas) {
    ctx.fillStyle = rgb(bg);
    ctx.fillRect(box.x0 - 2, box.y0 - 2, box.x1 - box.x0 + 4, box.y1 - box.y0 + 4);
  }

  areas.forEach(({ box, fg, lineHeight }, i) => {
    const text = translations[i]?.trim();
    if (!text) return;
    const width = box.x1 - box.x0;
    const height = box.y1 - box.y0;
    const fit = fitText(ctx, text, width, height, lineHeight * 0.85);
    ctx.fillStyle = rgb(fg);
    ctx.textBaseline = "top";
    ctx.direction = rtl ? "rtl" : "ltr";
    ctx.textAlign = rtl ? "right" : "left";
    const x = rtl ? box.x1 : box.x0;
    const blockHeight = fit.lines.length * fit.lineHeight;
    const y = box.y0 + Math.max(0, (height - blockHeight) / 2);
    fit.lines.forEach((line, n) => ctx.fillText(line, x, y + n * fit.lineHeight));
  });

  return canvasToBlob(canvas);
}

/** Fallback when the layout can't be reconstructed (e.g. edited text): a clean card with the translation. */
export async function renderTextCard(text: string, targetLang: string, title: string): Promise<Blob> {
  const width = 1200;
  const padding = 80;
  const measure = createCanvas(width, 10).ctx;
  measure.font = `400 32px ${FONT_STACK}`;
  const paragraphs = text.split(/\n/);
  const lines = paragraphs.flatMap((p) => (p.trim() ? wrapText(measure, p, width - padding * 2) : [""]));
  const lineHeight = 48;
  const height = padding * 2 + 90 + lines.length * lineHeight + 60;

  const { canvas, ctx } = createCanvas(width, height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, "#2563eb");
  gradient.addColorStop(1, "#7c3aed");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, 12);

  ctx.fillStyle = "#64748b";
  ctx.font = `600 24px ${FONT_STACK}`;
  ctx.textBaseline = "top";
  ctx.fillText(title, padding, padding);

  const rtl = isRtl(targetLang);
  ctx.direction = rtl ? "rtl" : "ltr";
  ctx.textAlign = rtl ? "right" : "left";
  ctx.fillStyle = "#0f172a";
  ctx.font = `400 32px ${FONT_STACK}`;
  const x = rtl ? width - padding : padding;
  lines.forEach((line, i) => ctx.fillText(line, x, padding + 90 + i * lineHeight));

  ctx.direction = "ltr";
  ctx.textAlign = "left";
  ctx.fillStyle = "#94a3b8";
  ctx.font = `500 20px ${FONT_STACK}`;
  ctx.fillText("Translated with SnapTranslate", padding, height - padding + 10);

  return canvasToBlob(canvas);
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Export failed"))), "image/png"),
  );
}
