import { errorFromStatus, fetchWithTimeout, ProviderError, type TranslationProvider } from "./types";

/** LibreTranslate (self-hosted or hosted). Env: LIBRETRANSLATE_URL, optional LIBRETRANSLATE_API_KEY */

const CODE_MAP: Record<string, string> = { "zh-CN": "zh-Hans", "zh-TW": "zh-Hant", no: "nb" };
const toLibre = (code: string) => CODE_MAP[code] ?? code;

export function createLibreTranslateProvider(baseUrl: string, apiKey?: string): TranslationProvider {
  const url = baseUrl.replace(/\/+$/, "");
  return {
    name: "libretranslate",
    async translate(texts, source, target) {
      const res = await fetchWithTimeout(`${url}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: texts,
          source: source === "auto" ? "auto" : toLibre(source),
          target: toLibre(target),
          format: "text",
          ...(apiKey && { api_key: apiKey }),
        }),
      });
      if (!res.ok) throw errorFromStatus("libretranslate", res.status, await res.text());
      const json = (await res.json()) as {
        translatedText?: string[] | string;
        detectedLanguage?: { language: string }[] | { language: string };
      };
      const out = json.translatedText;
      if (!out) throw new ProviderError("TRANSLATION_FAILED", "libretranslate: malformed response");
      const detected = Array.isArray(json.detectedLanguage) ? json.detectedLanguage[0] : json.detectedLanguage;
      return { translations: Array.isArray(out) ? out : [out], detectedSource: detected?.language };
    },
  };
}
