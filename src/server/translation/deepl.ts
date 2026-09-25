import { errorFromStatus, fetchWithTimeout, ProviderError, type TranslationProvider } from "./types";

/** DeepL API. Env: DEEPL_API_KEY (free-tier keys end in ":fx"). */

const TARGET_OVERRIDES: Record<string, string> = {
  en: "EN-US",
  pt: "PT-BR",
  "zh-CN": "ZH-HANS",
  "zh-TW": "ZH-HANT",
  no: "NB",
};

const toSource = (code: string) => code.split("-")[0].toUpperCase().replace("NO", "NB");
const toTarget = (code: string) => TARGET_OVERRIDES[code] ?? code.toUpperCase();

export function createDeepLProvider(apiKey: string): TranslationProvider {
  const host = apiKey.endsWith(":fx") ? "https://api-free.deepl.com" : "https://api.deepl.com";
  return {
    name: "deepl",
    async translate(texts, source, target) {
      const res = await fetchWithTimeout(`${host}/v2/translate`, {
        method: "POST",
        headers: { Authorization: `DeepL-Auth-Key ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          text: texts,
          target_lang: toTarget(target),
          ...(source !== "auto" && { source_lang: toSource(source) }),
        }),
      });
      if (!res.ok) throw errorFromStatus("deepl", res.status, await res.text());
      const json = (await res.json()) as {
        translations?: { text: string; detected_source_language?: string }[];
      };
      if (!json.translations) throw new ProviderError("TRANSLATION_FAILED", "deepl: malformed response");
      return {
        translations: json.translations.map((t) => t.text),
        detectedSource: json.translations[0]?.detected_source_language?.toLowerCase(),
      };
    },
  };
}
