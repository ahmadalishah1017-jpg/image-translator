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

function unionOf(boxes: BoundingBox[]): BoundingBox {
  return {
    x0: Math.min(...boxes.map((b) => b.x0)),
    y0: Math.min(...boxes.map((b) => b.y0)),
    x1: Math.max(...boxes.map((b) => b.x1)),
    y1: Math.max(...boxes.map((b) => b.y1)),
  };
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

/**
 * Text colour = average of the pixels inside the box that differ most from the background
 * (the most distant ~12%). Works for any text/background pair, including coloured text on
 * coloured backgrounds, without a fixed contrast threshold.
 */
function sampleForeground(ctx: CanvasRenderingContext2D, box: BoundingBox, bg: RGB): RGB {
  const x0 = Math.max(0, Math.floor(box.x0));
  const y0 = Math.max(0, Math.floor(box.y0));
  const w = Math.max(1, Math.min(ctx.canvas.width - x0, Math.ceil(box.x1 - box.x0)));
  const h = Math.max(1, Math.min(ctx.canvas.height - y0, Math.ceil(box.y1 - box.y0)));
  const data = ctx.getImageData(x0, y0, w, h).data;
  const samples: { d: number; px: RGB }[] = [];
  const step = Math.max(1, Math.floor((w * h) / 20000)) * 4;
  for (let i = 0; i < data.length; i += step) {
    const px: RGB = [data[i], data[i + 1], data[i + 2]];
    samples.push({ d: (px[0] - bg[0]) ** 2 + (px[1] - bg[1]) ** 2 + (px[2] - bg[2]) ** 2, px });
  }
  samples.sort((a, b) => b.d - a.d);
  const top = samples.slice(0, Math.max(1, Math.round(samples.length * 0.12)));
  if (!top.length || top[0].d < 25 ** 2) return luminance(bg) > 128 ? [17, 24, 39] : [255, 255, 255];
  const avg = (c: 0 | 1 | 2) => top.reduce((s, t) => s + t.px[c], 0) / top.length;
  return [avg(0), avg(1), avg(2)];
}

const rgb = ([r, g, b]: RGB) => `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;

const FALLBACKS =
  '"Noto Sans", "Noto Sans Arabic", "Noto Sans Devanagari", "Noto Sans CJK SC", "Hiragino Sans", "Microsoft YaHei", sans-serif';
const SERIF_FALLBACKS = '"Noto Serif", "Noto Serif CJK SC", serif';

/** Font families we try to match the original text against. */
const FAMILIES = [
  `"Segoe UI", system-ui, -apple-system, Roboto, ${FALLBACKS}`,
  `Arial, "Helvetica Neue", Helvetica, ${FALLBACKS}`,
  `Georgia, "Times New Roman", ${SERIF_FALLBACKS}`,
  `"Times New Roman", Times, ${SERIF_FALLBACKS}`,
  `"Segoe Print", "Comic Sans MS", "Bradley Hand", "Chalkboard SE", cursive`,
];

/** Languages written without spaces between words are wrapped per character. */
const NO_SPACE_SCRIPTS = /[぀-ヿ㐀-鿿가-힯฀-๿຀-໿က-႟ក-៿]/;

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const tokens = NO_SPACE_SCRIPTS.test(text) ? Array.from(text) : text.split(/(\s+)/);
  const lines: string[] = [];
  let current = "";
  for (const token of tokens) {
    const candidate = current + token;
    if (current.trim() && ctx.measureText(candidate.trimEnd()).width > maxWidth) {
      lines.push(current.trim());
      current = token.trimStart();
    } else {
      current = candidate;
    }
  }
  if (current.trim()) lines.push(current.trim());
  return lines;
}

interface FontStyle {
  size: number;
  family: string;
  weight: 400 | 700;
}

const font = ({ size, family, weight }: FontStyle) => `${weight} ${size}px ${family}`;

/** Binary "ink" mask of an RGBA buffer: pixels that differ strongly from the background. */
function inkMask(data: Uint8ClampedArray, bgLum: number, threshold = 70): Uint8Array {
  const mask = new Uint8Array(data.length / 4);
  for (let i = 0; i < mask.length; i++) {
    const j = i * 4;
    mask[i] = Math.abs(luminance([data[j], data[j + 1], data[j + 2]]) - bgLum) > threshold ? 1 : 0;
  }
  return mask;
}

/** Share of pixels in a mask that are ink. */
function inkShare(mask: Uint8Array): number {
  let n = 0;
  for (let i = 0; i < mask.length; i++) n += mask[i];
  return n / (mask.length || 1);
}

/** Intersection-over-union of two masks. */
function overlap(a: Uint8Array, b: Uint8Array): number {
  let both = 0;
  let either = 0;
  for (let i = 0; i < a.length; i++) {
    both += a[i] & b[i];
    either += a[i] | b[i];
  }
  return either ? both / either : 0;
}

/**
 * Work out the font size, family and weight of an original line of text by rendering its
 * recognised text and matching it against the pixels in the image:
 * - size: scale until the rendered glyphs are as tall as the line's box
 * - family and weight: render every candidate at that size and score how well its letter
 *   shapes overlap the original pixels (compared at a small, blur-tolerant scale)
 * Returns the best weight for each candidate family, with its score.
 */
function estimateStyles(
  ctx: CanvasRenderingContext2D,
  text: string,
  box: BoundingBox,
  bg: RGB,
): { style: FontStyle; score: number }[] {
  const boxW = Math.max(1, box.x1 - box.x0);
  const boxH = Math.max(1, box.y1 - box.y0);

  // Compare at a fixed small height: fast, and tolerant of slight misalignment.
  const k = 28 / boxH;
  const mw = Math.max(1, Math.round(boxW * k));
  const mh = Math.max(1, Math.round(boxH * k));
  const probe = createCanvas(mw, mh).ctx;

  probe.drawImage(ctx.canvas, box.x0, box.y0, boxW, boxH, 0, 0, mw, mh);
  const original = inkMask(probe.getImageData(0, 0, mw, mh).data, luminance(bg));

  const render = (style: FontStyle) => {
    probe.fillStyle = "#fff";
    probe.fillRect(0, 0, mw, mh);
    probe.fillStyle = "#000";
    probe.font = font({ ...style, size: style.size * k });
    probe.textBaseline = "alphabetic";
    probe.textAlign = "left";
    const m = probe.measureText(text);
    // Stretch horizontally so both ink boxes line up; the stretch itself is penalised below.
    const inkW = m.actualBoundingBoxLeft + m.actualBoundingBoxRight || 1;
    const stretch = mw / inkW;
    probe.save();
    probe.scale(stretch, 1);
    probe.fillText(text, m.actualBoundingBoxLeft, m.actualBoundingBoxAscent);
    probe.restore();
    return { mask: inkMask(probe.getImageData(0, 0, mw, mh).data, 255), stretch };
  };

  // Letter shapes only tell Latin-alphabet fonts apart. For other scripts (CJK, Arabic, Devanagari…)
  // the candidates all fall back to the same system font, so use the default sans and match only the weight.
  const letters = text.match(/\p{L}/gu) ?? [];
  const latin = letters.filter((c) => /[A-Za-zÀ-ɏ]/.test(c)).length;
  const families = latin >= letters.length / 2 ? FAMILIES : FAMILIES.slice(0, 1);

  return families.map((family) => {
    ctx.font = font({ size: 100, family, weight: 400 });
    const m = ctx.measureText(text);
    const glyphHeight = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
    // Guard against junk measurements (e.g. text of only dots or dashes).
    const size = glyphHeight > 20 ? (100 * boxH) / glyphHeight : boxH * 0.8;
    let best: { style: FontStyle; score: number } | undefined;
    for (const weight of [400, 700] as const) {
      const style = { size, family, weight };
      const { mask, stretch } = render(style);
      // Latin text: compare letter shapes. Other scripts: compare stroke thickness (share of ink),
      // which tells regular from bold reliably even when the rendering font differs.
      const score =
        families.length > 1
          ? overlap(mask, original) - Math.abs(Math.log(stretch)) * 0.5
          : -Math.abs(inkShare(mask) - inkShare(original));
      if (!best || score > best.score) best = { style, score };
    }
    return best!;
  });
}

type Align = "left" | "center" | "right";

function detectAlignment(boxes: BoundingBox[], imageWidth: number, rtl: boolean): Align {
  if (boxes.length > 1) {
    const spread = (values: number[]) => Math.max(...values) - Math.min(...values);
    const left = spread(boxes.map((b) => b.x0));
    const right = spread(boxes.map((b) => b.x1));
    const center = spread(boxes.map((b) => (b.x0 + b.x1) / 2));
    if (center < left && center < right) return "center";
    return right < left ? "right" : "left";
  }
  const [b] = boxes;
  const center = (b.x0 + b.x1) / 2;
  if (Math.abs(center - imageWidth / 2) < imageWidth * 0.04 && b.x0 > imageWidth * 0.1) return "center";
  return rtl ? "right" : "left";
}

/**
 * Remove the text strokes inside `box` and rebuild the pixels behind them from their
 * surroundings (onion-peel inpainting). Unlike painting a solid box, the photo's own
 * texture, gradients and shading carry on underneath where the letters were.
 */
function inpaintText(ctx: CanvasRenderingContext2D, box: BoundingBox, fg: RGB, bg: RGB, strokePad: number) {
  const r = Math.max(1, Math.round(strokePad));
  const m = r + 2;
  const x0 = Math.max(0, Math.floor(box.x0) - m);
  const y0 = Math.max(0, Math.floor(box.y0) - m);
  const x1 = Math.min(ctx.canvas.width, Math.ceil(box.x1) + m);
  const y1 = Math.min(ctx.canvas.height, Math.ceil(box.y1) + m);
  const w = x1 - x0;
  const h = y1 - y0;
  if (w < 3 || h < 3) return;
  const img = ctx.getImageData(x0, y0, w, h);
  const d = img.data;

  // 1. Text pixels: inside the line box and clearly different from the background (at least
  //    30% of the way from the background colour towards the text colour).
  const dist = (i: number, c: RGB) => (d[i] - c[0]) ** 2 + (d[i + 1] - c[1]) ** 2 + (d[i + 2] - c[2]) ** 2;
  const contrast = (fg[0] - bg[0]) ** 2 + (fg[1] - bg[1]) ** 2 + (fg[2] - bg[2]) ** 2;
  const threshold = Math.max(contrast * 0.09, 30 ** 2);
  let mask = new Uint8Array(w * h);
  const bx0 = Math.max(0, Math.floor(box.x0) - x0);
  const by0 = Math.max(0, Math.floor(box.y0) - y0);
  const bx1 = Math.min(w, Math.ceil(box.x1) - x0);
  const by1 = Math.min(h, Math.ceil(box.y1) - y0);
  for (let y = by0; y < by1; y++) {
    for (let x = bx0; x < bx1; x++) {
      const p = y * w + x;
      if (dist(p * 4, bg) > threshold) mask[p] = 1;
    }
  }

  // 2. Grow the mask a little to also cover anti-aliased letter edges and faint halos.
  for (const horizontal of [true, false]) {
    const grown = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!mask[y * w + x]) continue;
        for (let k = -r; k <= r; k++) {
          const xx = horizontal ? x + k : x;
          const yy = horizontal ? y : y + k;
          if (xx > 0 && yy > 0 && xx < w - 1 && yy < h - 1) grown[yy * w + xx] = 1;
        }
      }
    }
    mask = grown;
  }

  // 3. Fill from the outside in: each pass fills the hole's rim with the average of known neighbours.
  let holes: number[] = [];
  for (let p = 0; p < mask.length; p++) if (mask[p]) holes.push(p);
  const filled = holes.slice();
  while (holes.length) {
    const updates: [number, number, number, number][] = [];
    const remaining: number[] = [];
    for (const p of holes) {
      const x = p % w;
      const y = (p - x) / w;
      let rs = 0, gs = 0, bs = 0, n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          if ((dx || dy) && xx >= 0 && yy >= 0 && xx < w && yy < h && !mask[yy * w + xx]) {
            const q = (yy * w + xx) * 4;
            rs += d[q];
            gs += d[q + 1];
            bs += d[q + 2];
            n++;
          }
        }
      }
      if (n) updates.push([p, rs / n, gs / n, bs / n]);
      else remaining.push(p);
    }
    if (!updates.length) break;
    for (const [p, rr, gg, bb] of updates) {
      d[p * 4] = rr;
      d[p * 4 + 1] = gg;
      d[p * 4 + 2] = bb;
      mask[p] = 0;
    }
    holes = remaining;
  }

  // 4. Soften the streaks the fill leaves behind (only inside the repaired area).
  for (let pass = 0; pass < 2; pass++) {
    const copy = new Uint8ClampedArray(d);
    for (const p of filled) {
      const x = p % w;
      const y = (p - x) / w;
      if (x < 1 || y < 1 || x >= w - 1 || y >= h - 1) continue;
      for (let c = 0; c < 3; c++) {
        let s = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s += copy[((y + dy) * w + x + dx) * 4 + c];
        d[p * 4 + c] = s / 9;
      }
    }
  }

  ctx.putImageData(img, x0, y0);
}

/**
 * How far the background behind a text block continues sideways before it changes — e.g. the
 * edge of a price tag, badge or banner, or other content in the picture. A longer translation
 * may only grow into that space, so text stays on the surface it was printed on.
 */
function backgroundExtent(
  ctx: CanvasRenderingContext2D,
  block: BoundingBox,
  bg: RGB,
): { left: number; right: number } {
  const { width, height } = ctx.canvas;
  const y0 = Math.max(0, Math.floor(block.y0));
  const y1 = Math.min(height, Math.ceil(block.y1));
  const h = Math.max(1, y1 - y0);
  const data = ctx.getImageData(0, y0, width, h).data;
  const differs = (x: number) => {
    let off = 0;
    let n = 0;
    for (let y = 0; y < h; y += 2) {
      const i = (y * width + x) * 4;
      if ((data[i] - bg[0]) ** 2 + (data[i + 1] - bg[1]) ** 2 + (data[i + 2] - bg[2]) ** 2 > 45 ** 2) off++;
      n++;
    }
    return off / n > 0.25;
  };
  let right = Math.min(width - 1, Math.ceil(block.x1) + 2);
  while (right < width - 1 && !differs(right)) right++;
  let left = Math.max(0, Math.floor(block.x0) - 2);
  while (left > 0 && !differs(left)) left--;
  return { left, right };
}

/**
 * Replace each piece of text in the image with its translation, keeping the original
 * position, font size, line spacing, alignment and colour. Only the language changes.
 */
export async function renderTranslatedImage(
  image: LoadedImage,
  segments: TextSegment[],
  translations: string[],
  targetLang: string,
): Promise<{ blob: Blob; preview: string }> {
  const maxSide = 4000;
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const { canvas, ctx } = createCanvas(image.width * scale, image.height * scale);
  ctx.drawImage(image.element, 0, 0, canvas.width, canvas.height);

  const rtl = isRtl(targetLang);

  // Measure everything from the untouched image before erasing anything.
  const measured = segments.map((segment) => {
    const lineBoxes = segment.lineBoxes.map((b) => scaleBox(b, scale));
    const box = scaleBox(segment.bbox, scale);
    const bg = sampleBackground(ctx, box);
    const fg = sampleForeground(ctx, box, bg);
    const candidates = segment.lines.map((text, i) => estimateStyles(ctx, text, lineBoxes[i], bg));
    return { segment, lineBoxes, bg, fg, candidates };
  });

  // Most images use one typeface throughout, so pick the font that matches best across all lines.
  // A line only gets a different font when that font matches it clearly better.
  const totals = new Map<string, number>();
  for (const { candidates } of measured) {
    for (const lineCandidates of candidates) {
      if (lineCandidates.length < 2) continue; // non-Latin line: no font information
      for (const c of lineCandidates) totals.set(c.style.family, (totals.get(c.style.family) ?? 0) + c.score);
    }
  }
  const imageFamily = [...totals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? FAMILIES[0];
  const chooseStyle = (lineCandidates: { style: FontStyle; score: number }[]) => {
    const best = lineCandidates.reduce((a, b) => (b.score > a.score ? b : a));
    const shared = lineCandidates.find((c) => c.style.family === imageFamily);
    return shared && best.score - shared.score < 0.1 ? shared.style : best.style;
  };

  const layouts = measured.map(({ segment, lineBoxes, bg, fg, candidates }) => {
    const styles = candidates.map(chooseStyle);
    const longest = styles.reduce((best, s, i) =>
      lineBoxes[i].x1 - lineBoxes[i].x0 > lineBoxes[best].x1 - lineBoxes[best].x0 ? i : best, 0);
    const style: FontStyle = {
      ...styles[longest],
      size: Math.max(6, median(styles.map((s) => s.size))),
    };
    // Baselines of the original lines: bottom of the ink minus the text's descent at this size.
    const baselines = segment.lines.map((text, i) => {
      ctx.font = font(style);
      return lineBoxes[i].y1 - ctx.measureText(text).actualBoundingBoxDescent;
    });
    const gaps = baselines.slice(1).map((y, i) => y - baselines[i]);
    const pitch = gaps.length ? median(gaps) : style.size * 1.25;
    // Each line gets its own colours for erasing: pieces of text on one row can differ in colour.
    const lineColors = lineBoxes.map((b) => {
      const lbg = sampleBackground(ctx, b);
      return { bg: lbg, fg: sampleForeground(ctx, b, lbg) };
    });
    const extent = backgroundExtent(ctx, unionOf(lineBoxes), bg);
    return { lineBoxes, lineColors, bg, fg, style, baselines, pitch, extent };
  });

  // Remove the original text, rebuilding the background behind each line.
  for (const { lineBoxes, lineColors, style } of layouts) {
    lineBoxes.forEach((b, n) =>
      inpaintText(ctx, b, lineColors[n].fg, lineColors[n].bg, Math.max(1.5, style.size * 0.07)),
    );
  }

  layouts.forEach(({ lineBoxes, fg, style, baselines, pitch, extent }, i) => {
    const text = translations[i]?.trim();
    if (!text) return;

    const align = detectAlignment(lineBoxes, canvas.width, rtl);
    const left = Math.min(...lineBoxes.map((b) => b.x0));
    const right = Math.max(...lineBoxes.map((b) => b.x1));
    const top = Math.min(...lineBoxes.map((b) => b.y0));
    const bottom = Math.max(...lineBoxes.map((b) => b.y1));
    const center = (left + right) / 2;
    const blockWidth = right - left;

    // Free space on the same rows: up to the nearest other text (or the image edge).
    const edge = Math.max(4, canvas.width * 0.025);
    let leftLimit = Math.min(left, edge);
    let rightLimit = Math.max(right, canvas.width - edge);
    for (const other of layouts) {
      if (other === layouts[i]) continue;
      for (const b of other.lineBoxes) {
        if (b.y1 <= top || b.y0 >= bottom) continue; // not on these rows
        if (b.x0 >= right) rightLimit = Math.min(rightLimit, b.x0 - 4);
        if (b.x1 <= left) leftLimit = Math.max(leftLimit, b.x1 + 4);
      }
    }
    // …and not past the edge of the surface the text sits on (tag, badge, banner).
    const inset = style.size * 0.25;
    leftLimit = Math.max(leftLimit, Math.min(left, extent.left + inset));
    rightLimit = Math.min(rightLimit, Math.max(right, extent.right - inset));
    const available =
      align === "left" ? rightLimit - left
      : align === "right" ? right - leftLimit
      : 2 * Math.min(center - leftLimit, rightLimit - center);
    // A longer translation may grow a little into free space beside it (never onto new rows).
    const maxWidth = Math.max(blockWidth * 1.03, Math.min(blockWidth * 1.5, available));

    // Keep the original font size whenever the translation fits the text's area; only if it
    // doesn't, reduce the size as little as needed. Text never spills below its original area.
    const place = (size: number) => {
      const s = { ...style, size };
      ctx.font = font(s);
      const ratio = size / style.size;
      const layout = (wrapWidth: number) => {
        const lines = wrapText(ctx, text, wrapWidth);
        let ys = lines.map((_, n) =>
          ratio === 1 && n < baselines.length ? baselines[n] : top + (baselines[0] - top) * ratio + pitch * ratio * n,
        );
        const ascent = ctx.measureText(lines[0] ?? "").actualBoundingBoxAscent;
        const descent = ctx.measureText(lines[lines.length - 1] ?? "").actualBoundingBoxDescent;
        if (ratio < 1) {
          // Smaller text sits vertically centred in the original area.
          const shift = (top + bottom) / 2 - (ys[0] - ascent + ys[ys.length - 1] + descent) / 2;
          ys = ys.map((y) => y + shift);
        }
        const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
        const fits = widest <= maxWidth && ys[ys.length - 1] + descent <= bottom + size * 0.15;
        return { s, lines, ys, fits };
      };
      // Prefer the original line width; use the extra room only when needed.
      const narrow = layout(blockWidth * 1.03);
      return narrow.fits ? narrow : layout(maxWidth);
    };
    let placed = place(style.size);
    for (let size = style.size * 0.95; !placed.fits && size >= style.size * 0.3; size *= 0.95) {
      placed = place(size);
    }

    ctx.font = font(placed.s);
    ctx.fillStyle = rgb(fg);
    ctx.textBaseline = "alphabetic";
    ctx.direction = rtl ? "rtl" : "ltr";
    ctx.textAlign = align;
    const x = align === "left" ? left : align === "right" ? right : center;
    placed.lines.forEach((line, n) => ctx.fillText(line, x, placed.ys[n]));
  });

  return { blob: await canvasToBlob(canvas), preview: downscaleToDataUrl(canvas, 480) };
}

/** Small JPEG preview (used for Recent Scans). */
function downscaleToDataUrl(source: HTMLCanvasElement, size: number): string {
  const scale = Math.min(1, size / Math.max(source.width, source.height));
  const { canvas, ctx } = createCanvas(source.width * scale, source.height * scale);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.75);
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Export failed"))), "image/png"),
  );
}
