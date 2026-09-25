export type ProviderErrorCode =
  | "RATE_LIMITED"
  | "LANGUAGE_UNSUPPORTED"
  | "TRANSLATION_FAILED"
  | "NOT_CONFIGURED";

export class ProviderError extends Error {
  constructor(
    public readonly code: ProviderErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

export interface ProviderResult {
  translations: string[];
  detectedSource?: string;
}

/** Implement this to connect a new translation backend. */
export interface TranslationProvider {
  readonly name: string;
  /** `source` is a language code or "auto". */
  translate(texts: string[], source: string, target: string): Promise<ProviderResult>;
}

/** Map an HTTP status from an upstream API to a provider error. */
export function errorFromStatus(provider: string, status: number, detail = ""): ProviderError {
  if (status === 429 || status === 456) return new ProviderError("RATE_LIMITED", `${provider}: quota exceeded`);
  if (status === 401 || status === 403) return new ProviderError("NOT_CONFIGURED", `${provider}: invalid API key`);
  if (status === 400 && /language|lang/i.test(detail)) {
    return new ProviderError("LANGUAGE_UNSUPPORTED", `${provider}: ${detail}`);
  }
  return new ProviderError("TRANSLATION_FAILED", `${provider}: HTTP ${status} ${detail}`.trim());
}

export async function fetchWithTimeout(url: string, init: RequestInit, ms = 20_000): Promise<Response> {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(ms), cache: "no-store" });
  } catch (err) {
    throw new ProviderError("TRANSLATION_FAILED", `Upstream request failed: ${(err as Error).message}`);
  }
}
