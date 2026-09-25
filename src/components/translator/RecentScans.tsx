"use client";

import { ArrowRight, Clock, FileText, Trash2, X } from "lucide-react";
import { card } from "@/components/ui";
import { clearHistory, removeScan, useScanHistory, type ScanRecord } from "@/lib/history";
import { languageName } from "@/lib/languages";

const timeFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

export function RecentScans({ onOpen }: { onOpen: (record: ScanRecord) => void }) {
  const items = useScanHistory();

  return (
    <section aria-labelledby="recent-scans-title" className={`${card} p-5 text-left sm:p-6`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="recent-scans-title" className="flex items-center gap-2 text-lg font-bold text-ink">
            <Clock className="size-5 text-brand-600" aria-hidden="true" />
            Recent Scans
          </h2>
          <p className="mt-0.5 text-sm text-ink-muted">Saved only in this browser. Images are never uploaded.</p>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Clear all recent scans from this browser?")) clearHistory();
            }}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-ink-soft hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Clear History
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-line px-4 py-8 text-center">
          <FileText className="mx-auto size-8 text-ink-muted/60" aria-hidden="true" />
          <p className="mt-2 font-semibold text-ink-soft">No scans yet</p>
          <p className="mt-1 text-sm text-ink-muted">Your recent translations will appear here.</p>
        </div>
      ) : (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.id} className="group relative">
              <button
                type="button"
                onClick={() => onOpen(item)}
                className="flex w-full items-center gap-3 rounded-xl border border-line p-3 pr-11 text-left transition hover:border-brand-100 hover:bg-brand-50/50"
              >
                {item.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.thumbnail} alt="" className="size-12 shrink-0 rounded-lg border border-line object-cover" />
                ) : (
                  <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-surface">
                    <FileText className="size-5 text-ink-muted" aria-hidden="true" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-ink">
                    {item.title} — {languageName(item.targetLang)}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1 text-xs text-ink-muted">
                    {languageName(item.detectedLang ?? item.sourceLang)}
                    <ArrowRight className="size-3" aria-hidden="true" />
                    {languageName(item.targetLang)} · {timeFormat.format(item.createdAt)}
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => removeScan(item.id)}
                aria-label={`Delete "${item.title}" from history`}
                className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-ink-muted hover:bg-red-50 hover:text-red-700"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
