import { createLocalStore } from "./local-store";

/** Stored only in this browser's localStorage. The full image is never stored — only a small thumbnail. */
export interface ScanRecord {
  id: string;
  title: string;
  createdAt: number;
  sourceLang: string;
  detectedLang?: string;
  targetLang: string;
  originalText: string;
  translatedText: string;
  thumbnail?: string;
}

const MAX_ITEMS = 20;

const store = createLocalStore<ScanRecord[]>("snaptranslate:history:v1", []);

export const useScanHistory = store.useValue;

export function addScan(record: ScanRecord) {
  let items = [record, ...store.get().filter((r) => r.id !== record.id)].slice(0, MAX_ITEMS);
  // If storage is full, drop thumbnails, then the oldest entries, until it fits.
  if (store.set(items)) return;
  items = items.map((r, i) => (i === 0 ? r : { ...r, thumbnail: undefined }));
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

export function scanTitle(text: string, fallback: string): string {
  const firstLine = text.split("\n").map((l) => l.trim()).find((l) => l.length > 1);
  const base = firstLine ?? fallback;
  return base.length > 42 ? `${base.slice(0, 40).trimEnd()}…` : base;
}
