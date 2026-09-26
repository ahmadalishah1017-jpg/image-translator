import { errorFromStatus, fetchWithTimeout, ProviderError, type TranslationProvider } from "./types";

/**
 * MyMemory public API — works without an API key, so the app runs out of the box.
 * Limits: ~500 bytes per request and a small daily quota (raised by setting MYMEMORY_EMAIL).
 * Use Google, DeepL or LibreTranslate in production.
 */

const MAX_CHUNK = 450;

/** Split long text at sentence, then word boundaries so each request stays under the size limit. */
export function chunkText(text: string, max = MAX_CHUNK): string[] {
  if (text.length <= max) return [text];
  const sentences = text.match(/[^.!?。！？]+[.!?。！？]*\s*/g) ?? [text];
  const chunks: string[] = [];
  let current = "";
  const flush = () => {
    if (current.trim()) chunks.push(current.trim());
    current = "";
  };
  for (const sentence of sentences) {
    if ((current + sentence).length <= max) {
      current += sentence;
      continue;
    }
    flush();
    if (sentence.length <= max) {
      current = sentence;
      continue;
    }
    for (const word of sentence.split(/(\s+)/)) {
      if ((current + word).length > max) flush();
      current += word.length > max ? word.slice(0, max) : word;
    }
  }
  flush();
  return chunks;
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return results;
}

export function createMyMemoryProvider(email?: string): TranslationProvider {
  async function translateOne(text: string, source: string, target: string) {
    const params = new URLSearchParams({
      q: text,
      langpair: `${source === "auto" ? "Autodetect" : source}|${target}`,
      // Skip MyMemory's public translation memory: it returns translations of merely *similar*
      // sentences (e.g. with different numbers or times). Use its machine translation instead.
      onlyprivate: "1",
      mt: "1",
    });
    if (email) params.set("de", email);
    const res = await fetchWithTimeout(`https://api.mymemory.translated.net/get?${params}`, {});
    if (!res.ok) throw errorFromStatus("mymemory", res.status);
    const json = (await res.json()) as {
      responseStatus: number | string;
      responseDetails?: string;
      responseData?: { translatedText?: string; detectedLanguage?: string };
    };
    const status = Number(json.responseStatus);
    const translated = json.responseData?.translatedText ?? "";
    if (status === 429 || /MYMEMORY WARNING|QUOTA/i.test(translated)) {
      throw new ProviderError("RATE_LIMITED", "mymemory: daily quota exceeded");
    }
    if (status !== 200) {
      const detail = json.responseDetails ?? "";
      throw new ProviderError(
        /LANGPAIR|LANGUAGE/i.test(detail) ? "LANGUAGE_UNSUPPORTED" : "TRANSLATION_FAILED",
        `mymemory: ${status} ${detail}`,
      );
    }
    return { text: translated, detected: json.responseData?.detectedLanguage };
  }

  return {
    name: "mymemory",
    async translate(texts, source, target) {
      let detectedSource: string | undefined;
      const translations = await mapLimit(texts, 3, async (text) => {
        const parts = await Promise.all(
          chunkText(text).map(async (chunk) => {
            const r = await translateOne(chunk, source, target);
            detectedSource ??= r.detected?.split("-")[0];
            return r.text;
          }),
        );
        return parts.join(" ");
      });
      return { translations, detectedSource };
    },
  };
}
