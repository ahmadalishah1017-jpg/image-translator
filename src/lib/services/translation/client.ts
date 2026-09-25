import { AppError, type AppErrorCode, ERROR_MESSAGES } from "@/lib/errors";
import type {
  TranslationErrorBody,
  TranslationRequest,
  TranslationResponse,
  TranslationService,
} from "./types";

/** Calls this app's `/api/translate` route, which forwards to the configured provider. */
export const apiTranslationService: TranslationService = {
  async translate(request: TranslationRequest, signal?: AbortSignal): Promise<TranslationResponse> {
    let res: Response;
    try {
      res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
        signal,
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") throw err;
      throw new AppError("NETWORK");
    }

    if (!res.ok) {
      let code: AppErrorCode = res.status === 429 ? "RATE_LIMITED" : "TRANSLATION_FAILED";
      try {
        const body = (await res.json()) as TranslationErrorBody;
        if (body.error?.code && body.error.code in ERROR_MESSAGES) {
          code = body.error.code as AppErrorCode;
        }
      } catch {
        // Non-JSON error response — keep the status-based code.
      }
      throw new AppError(code);
    }

    return (await res.json()) as TranslationResponse;
  },
};
