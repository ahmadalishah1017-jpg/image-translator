/**
 * Helpers for turning OCR lines into translatable units.
 *
 * OCR engines group text into paragraphs, but menus, lists and signs often put
 * independent items in one "paragraph". Lines are split into separate units when
 * a line ends a sentence, the next line starts with a capital/number/bullet, or
 * the text size changes noticeably — while wrapped prose stays together.
 */

/** Scripts written without spaces between words (CJK, Thai, Lao, Khmer, Burmese). */
export const NO_SPACE_SCRIPT = /[぀-ヿ㐀-鿿豈-﫿฀-໿က-႟ក-៿]/;

/** OCR often inserts spaces between CJK/Thai characters; remove them while keeping spaces around Latin words. */
export function normalizeOcrLine(text: string): string {
  const trimmed = text.trim();
  if (!NO_SPACE_SCRIPT.test(trimmed)) return trimmed;
  return trimmed.replace(/(?<=[^\x00-\x7f])\s+(?=[^\x00-\x7f])/g, "");
}

const SENTENCE_END = /[.!?:;。！？：；]$/;
const LIST_START = /^[\d•\-–—*·●▪►→]/;

export function startsNewUnit(prev: string, next: string, prevHeight?: number, nextHeight?: number): boolean {
  if (prevHeight && nextHeight) {
    const ratio = Math.max(prevHeight, nextHeight) / Math.min(prevHeight, nextHeight);
    if (ratio > 1.3) return true;
  }
  if (/[-‐]$/.test(prev)) return false; // hyphenated word wrap
  if (SENTENCE_END.test(prev)) return true;
  if (LIST_START.test(next)) return true;
  const first = next.charAt(0);
  return first !== first.toLowerCase(); // starts with an uppercase letter
}

/** Group consecutive line indices into units. */
export function groupLines(lines: string[], heights?: number[]): number[][] {
  const groups: number[][] = [];
  lines.forEach((line, i) => {
    if (i > 0 && !startsNewUnit(lines[i - 1], line, heights?.[i - 1], heights?.[i])) {
      groups[groups.length - 1].push(i);
    } else {
      groups.push([i]);
    }
  });
  return groups;
}

export interface TextUnit {
  text: string;
  /** Units sharing a paragraph number are joined with a line break; paragraphs with a blank line. */
  paragraph: number;
}

/** Split free text (e.g. after the user edits it) into translatable units. */
export function textToUnits(text: string): TextUnit[] {
  const units: TextUnit[] = [];
  text
    .split(/\n\s*\n/)
    .map((p) => p.split("\n").map((l) => l.trim()).filter(Boolean))
    .filter((lines) => lines.length)
    .forEach((lines, paragraph) => {
      for (const group of groupLines(lines)) {
        units.push({ text: group.map((i) => lines[i]).join(" "), paragraph });
      }
    });
  return units;
}

export function joinUnits(values: string[], paragraphs: number[]): string {
  return values.reduce((out, value, i) => {
    if (i === 0) return value;
    return out + (paragraphs[i] === paragraphs[i - 1] ? "\n" : "\n\n") + value;
  }, "");
}
