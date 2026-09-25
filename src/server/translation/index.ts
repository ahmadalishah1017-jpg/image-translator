import { createDeepLProvider } from "./deepl";
import { createGoogleProvider } from "./google";
import { createLibreTranslateProvider } from "./libretranslate";
import { createMyMemoryProvider } from "./mymemory";
import { ProviderError, type TranslationProvider } from "./types";

/**
 * Select the translation provider from environment variables.
 *
 * TRANSLATION_PROVIDER = google | deepl | libretranslate | mymemory
 * If unset, the first provider with credentials is used, falling back to MyMemory (no key needed).
 */
export function getTranslationProvider(env: NodeJS.ProcessEnv = process.env): TranslationProvider {
  const explicit = env.TRANSLATION_PROVIDER?.trim().toLowerCase();
  const provider =
    explicit ||
    (env.GOOGLE_TRANSLATE_API_KEY && "google") ||
    (env.DEEPL_API_KEY && "deepl") ||
    (env.LIBRETRANSLATE_URL && "libretranslate") ||
    "mymemory";

  switch (provider) {
    case "google":
      if (!env.GOOGLE_TRANSLATE_API_KEY) throw new ProviderError("NOT_CONFIGURED", "GOOGLE_TRANSLATE_API_KEY is not set");
      return createGoogleProvider(env.GOOGLE_TRANSLATE_API_KEY);
    case "deepl":
      if (!env.DEEPL_API_KEY) throw new ProviderError("NOT_CONFIGURED", "DEEPL_API_KEY is not set");
      return createDeepLProvider(env.DEEPL_API_KEY);
    case "libretranslate":
      if (!env.LIBRETRANSLATE_URL) throw new ProviderError("NOT_CONFIGURED", "LIBRETRANSLATE_URL is not set");
      return createLibreTranslateProvider(env.LIBRETRANSLATE_URL, env.LIBRETRANSLATE_API_KEY);
    case "mymemory":
      return createMyMemoryProvider(env.MYMEMORY_EMAIL);
    default:
      throw new ProviderError("NOT_CONFIGURED", `Unknown TRANSLATION_PROVIDER "${provider}"`);
  }
}

export { ProviderError } from "./types";
