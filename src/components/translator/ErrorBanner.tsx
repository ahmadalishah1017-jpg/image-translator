import { CircleAlert, X } from "lucide-react";
import { type AppError, ERROR_MESSAGES } from "@/lib/errors";

export function ErrorBanner({ error, onDismiss }: { error: AppError; onDismiss: () => void }) {
  const { title } = ERROR_MESSAGES[error.code];
  return (
    <div role="alert" className="flex animate-fade-up items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-left">
      <CircleAlert className="mt-0.5 size-5 shrink-0 text-red-600" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-red-900">{title}</p>
        <p className="mt-0.5 text-sm text-red-800">{error.message}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="grid size-8 shrink-0 place-items-center rounded-lg text-red-700 hover:bg-red-100"
        aria-label="Dismiss error"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
