export type AppErrorCode =
  | "UNSUPPORTED_FILE"
  | "FILE_TOO_LARGE"
  | "IMAGE_UNREADABLE"
  | "NO_TEXT"
  | "OCR_FAILED"
  | "TRANSLATION_FAILED"
  | "LANGUAGE_UNSUPPORTED"
  | "TEXT_TOO_LONG"
  | "NETWORK"
  | "RATE_LIMITED"
  | "NOT_CONFIGURED";

export const ERROR_MESSAGES: Record<AppErrorCode, { title: string; message: string }> = {
  UNSUPPORTED_FILE: {
    title: "Unsupported file type",
    message: "Please upload a JPG, PNG, or WebP image.",
  },
  FILE_TOO_LARGE: {
    title: "Image too large",
    message: "This image is over the 10 MB limit. Try a smaller or compressed version.",
  },
  IMAGE_UNREADABLE: {
    title: "We couldn't open this image",
    message: "The file may be damaged or in an unexpected format. Try exporting it again as JPG or PNG.",
  },
  NO_TEXT: {
    title: "No text detected",
    message: "We couldn't find readable text in this image. Try uploading a clearer image.",
  },
  OCR_FAILED: {
    title: "Text extraction failed",
    message: "Something went wrong while reading the image. Please try again, or try a different image.",
  },
  TRANSLATION_FAILED: {
    title: "Translation failed",
    message: "We extracted the text but couldn't translate it. Please try again in a moment.",
  },
  LANGUAGE_UNSUPPORTED: {
    title: "Language pair not supported",
    message: "The translation service doesn't support this language combination. Try a different language.",
  },
  TEXT_TOO_LONG: {
    title: "Too much text",
    message: "This image contains more text than we can translate at once. Try cropping it into smaller parts.",
  },
  NETWORK: {
    title: "Connection problem",
    message: "We couldn't reach the server. Check your internet connection and try again.",
  },
  RATE_LIMITED: {
    title: "Translation limit reached",
    message: "The translation service's usage limit has been reached. Please wait a little and try again.",
  },
  NOT_CONFIGURED: {
    title: "Translation unavailable",
    message: "The translation service isn't configured on this server yet.",
  },
};

export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message?: string,
  ) {
    super(message ?? ERROR_MESSAGES[code].message);
    this.name = "AppError";
  }
}

export function toAppError(err: unknown, fallback: AppErrorCode): AppError {
  if (err instanceof AppError) return err;
  if (err instanceof TypeError && /fetch|network|load failed/i.test(err.message)) {
    return new AppError("NETWORK");
  }
  return new AppError(fallback);
}
