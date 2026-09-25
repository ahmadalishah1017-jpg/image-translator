import { NextResponse, type NextRequest } from "next/server";
import { AUTO_DETECT, getLanguage } from "@/lib/languages";
import { TRANSLATION_LIMITS, type TranslationResponse } from "@/lib/services/translation/types";
import { getTranslationProvider, ProviderError } from "@/server/translation";
import { rateLimit } from "@/server/rate-limit";

const STATUS: Record<string, number> = {
  RATE_LIMITED: 429,
  LANGUAGE_UNSUPPORTED: 400,
  TEXT_TOO_LONG: 413,
  NOT_CONFIGURED: 503,
  TRANSLATION_FAILED: 502,
};

function error(code: string, message: string, status = STATUS[code] ?? 400) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(ip)) {
    return error("RATE_LIMITED", "Too many requests. Please wait a minute and try again.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error("TRANSLATION_FAILED", "Invalid JSON body.", 400);
  }

  const { texts, source, target } = (body ?? {}) as Record<string, unknown>;
  if (
    !Array.isArray(texts) ||
    texts.length === 0 ||
    !texts.every((t) => typeof t === "string") ||
    typeof source !== "string" ||
    typeof target !== "string"
  ) {
    return error("TRANSLATION_FAILED", "Expected { texts: string[], source: string, target: string }.", 400);
  }
  if (!getLanguage(target) || (source !== AUTO_DETECT && !getLanguage(source))) {
    return error("LANGUAGE_UNSUPPORTED", "Unknown language code.");
  }
  const total = (texts as string[]).reduce((n, t) => n + t.length, 0);
  if (texts.length > TRANSLATION_LIMITS.maxSegments || total > TRANSLATION_LIMITS.maxTotalChars) {
    return error("TEXT_TOO_LONG", "Too much text to translate in one request.");
  }

  try {
    const provider = getTranslationProvider();
    const result = await provider.translate(texts as string[], source, target);
    if (result.translations.length !== texts.length) {
      throw new ProviderError("TRANSLATION_FAILED", `${provider.name}: segment count mismatch`);
    }
    const payload: TranslationResponse = { ...result, provider: provider.name };
    return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof ProviderError) {
      console.error(`[translate] ${err.code}: ${err.message}`);
      return error(err.code, err.code === "NOT_CONFIGURED" ? "Translation service is not configured." : err.message);
    }
    console.error("[translate] unexpected error", err);
    return error("TRANSLATION_FAILED", "Unexpected translation error.");
  }
}
