import { errorFromStatus, fetchWithTimeout, ProviderError, type TranslationProvider } from "./types";

/** Google Cloud Translation API (v2 / Basic). Env: GOOGLE_TRANSLATE_API_KEY */
export function createGoogleProvider(apiKey: string): TranslationProvider {
  return {
    name: "google",
    async translate(texts, source, target) {
      const translations: string[] = [];
      let detectedSource: string | undefined;
      // The v2 API accepts up to 128 segments per request.
      for (let i = 0; i < texts.length; i += 100) {
        const res = await fetchWithTimeout(
          `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              q: texts.slice(i, i + 100),
              target,
              ...(source !== "auto" && { source }),
              format: "text",
            }),
          },
        );
        if (!res.ok) throw errorFromStatus("google", res.status, await res.text());
        const json = (await res.json()) as {
          data?: { translations?: { translatedText: string; detectedSourceLanguage?: string }[] };
        };
        const batch = json.data?.translations;
        if (!batch) throw new ProviderError("TRANSLATION_FAILED", "google: malformed response");
        for (const t of batch) {
          translations.push(t.translatedText);
          detectedSource ??= t.detectedSourceLanguage;
        }
      }
      return { translations, detectedSource };
    },
  };
}
