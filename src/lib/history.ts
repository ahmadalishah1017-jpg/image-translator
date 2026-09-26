import { createLocalStore } from "./local-store";

/**
 * Stored only in this browser's localStorage. Full-resolution images are never stored —
 * only a small preview of the translated image.
 */
export interface ScanRecord {
  id: string;
  title: string;
  createdAt: number;
  sourceLang: string;
  detectedLang?: string;
  targetLang: string;
  /** Downscaled JPEG data URL of the translated image. */
  preview?: string;
}

const MAX_ITEMS = 20;

const store = createLocalStore<ScanRecord[]>("snaptranslate:history:v2", []);

export const useScanHistory = store.useValue;

export function addScan(record: ScanRecord) {
  let items = [record, ...store.get().filter((r) => r.id !== record.id)].slice(0, MAX_ITEMS);
  // If storage is full, drop older previews, then the oldest entries, until it fits.
  if (store.set(items)) return;
  items = items.map((r, i) => (i === 0 ? r : { ...r, preview: undefined }));
  while (!store.set(items) && items.length > 1) {
    items = items.slice(0, -1);
  }
}

export function removeScan(id: string) {
  store.set((items) => items.filter((r) => r.id !== id));
}

export function clearHistory() {
  store.set([]);
}

/** "IMG_2041.jpg" → "IMG 2041", "pasted-image.png" → "Pasted image". */
export function scanTitle(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim() || "Image";
  const title = base.charAt(0).toUpperCase() + base.slice(1);
  return title.length > 42 ? `${title.slice(0, 40).trimEnd()}…` : title;
}
