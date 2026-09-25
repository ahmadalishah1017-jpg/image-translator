/** Shared between the browser client and the server route. */

export interface TranslationRequest {
  /** Text segments, translated independently so the layout can be reconstructed. */
  texts: string[];
  /** Language code, or "auto" to let the provider detect it. */
  source: string;
  target: string;
}

export interface TranslationResponse {
  translations: string[];
  detectedSource?: string;
  provider: string;
}

export interface TranslationErrorBody {
  error: { code: string; message: string };
}

/** Any translation backend the UI can talk to. */
export interface TranslationService {
  translate(request: TranslationRequest, signal?: AbortSignal): Promise<TranslationResponse>;
}

export const TRANSLATION_LIMITS = {
  maxSegments: 300,
  maxTotalChars: 12_000,
} as const;
