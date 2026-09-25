"use client";

import {
  Check,
  CircleCheck,
  Copy,
  FileDown,
  ImageDown,
  Pencil,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { forwardRef, useEffect, useState, type ReactNode } from "react";
import { btn, card } from "@/components/ui";
import { copyText, downloadText } from "@/lib/download";
import { getLanguage, isRtl, languageName } from "@/lib/languages";
import { LanguageSelect } from "./LanguageSelect";

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);
  return (
    <button
      type="button"
      className={btn.small}
      onClick={async () => setCopied(await copyText(text))}
      disabled={!text}
    >
      {copied ? <Check className="size-4 text-emerald-600" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
      <span aria-live="polite">{copied ? "Copied!" : label}</span>
    </button>
  );
}

function Panel({
  title,
  badge,
  actions,
  children,
  footer,
}: {
  title: string;
  badge?: ReactNode;
  actions: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section aria-label={title} className={`${card} flex min-h-0 flex-col`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-bold text-ink">{title}</h3>
          {badge}
        </div>
      </div>
      <div className="flex-1 p-4">{children}</div>
      <div className="flex flex-wrap gap-2 border-t border-line px-4 py-3">{actions}</div>
      {footer}
    </section>
  );
}

interface Props {
  originalText: string;
  sourceLabel: string;
  sourceCode?: string;
  onOriginalCommit: (text: string) => void;
  edited: boolean;
  translatedText: string;
  target: string;
  selectedTarget: string;
  onTargetChange: (code: string) => void;
  onTranslateAgain: () => void;
  onDownloadImage: () => void;
  canOverlay: boolean;
  busy: boolean;
  filenameBase: string;
  lowConfidence: boolean;
  stale: boolean;
}

export const ResultsPanel = forwardRef<HTMLDivElement, Props>(function ResultsPanel(props, ref) {
  const {
    originalText,
    sourceLabel,
    sourceCode,
    onOriginalCommit,
    edited,
    translatedText,
    target,
    selectedTarget,
    onTargetChange,
    onTranslateAgain,
    onDownloadImage,
    canOverlay,
    busy,
    filenameBase,
    lowConfidence,
    stale,
  } = props;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(originalText);

  const startEditing = () => {
    setDraft(originalText);
    setEditing(true);
  };
  const finishEditing = () => {
    setEditing(false);
    if (draft !== originalText) onOriginalCommit(draft);
  };

  const targetName = languageName(target);
  const bilingual = `${sourceLabel}\n\n${originalText}\n\n---\n\n${targetName}\n\n${translatedText}\n`;

  return (
    <div ref={ref} tabIndex={-1} className="animate-fade-up space-y-4 outline-none">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
          <CircleCheck className="size-4" aria-hidden="true" />
          Translation complete
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={`${btn.primary} py-2.5 text-sm`} onClick={onDownloadImage} disabled={busy}>
            <ImageDown className="size-4" aria-hidden="true" />
            Download Translated Image
          </button>
          <button
            type="button"
            className={`${btn.secondary} text-sm`}
            onClick={() => downloadText(bilingual, `${filenameBase}-bilingual.txt`)}
          >
            <FileDown className="size-4" aria-hidden="true" />
            Bilingual document
          </button>
        </div>
      </div>
      {!canOverlay && (
        <p className="text-xs text-ink-muted">
          The translated image will be a clean text card, because the original layout isn&apos;t available
          {edited ? " after editing the extracted text" : ""}.
        </p>
      )}

      {lowConfidence && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>
            Some text may not have been recognised accurately. If the text isn&apos;t in a Latin script (for
            example Arabic, Chinese or Hindi), choose its language under <strong>Source Language</strong> and
            translate again. You can also fix mistakes with <strong>Edit</strong>.
          </p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Original text"
          badge={<span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-semibold text-ink-soft">{sourceLabel}</span>}
          actions={
            <>
              <CopyButton text={editing ? draft : originalText} label="Copy" />
              <button type="button" className={btn.small} onClick={editing ? finishEditing : startEditing} aria-pressed={editing}>
                {editing ? <Check className="size-4" aria-hidden="true" /> : <Pencil className="size-4" aria-hidden="true" />}
                {editing ? "Done" : "Edit"}
              </button>
              <button
                type="button"
                className={btn.small}
                onClick={() => downloadText(editing ? draft : originalText, `${filenameBase}-original.txt`)}
              >
                <FileDown className="size-4" aria-hidden="true" />
                Download TXT
              </button>
            </>
          }
        >
          {editing ? (
            <>
              <label htmlFor="original-editor" className="sr-only">
                Edit extracted text
              </label>
              <textarea
                id="original-editor"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                dir="auto"
                autoFocus
                className="h-72 w-full resize-y rounded-xl border border-line p-3 leading-relaxed text-ink focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100"
              />
              <p className="mt-2 text-xs text-ink-muted">Separate paragraphs with a blank line.</p>
            </>
          ) : (
            <div
              dir={sourceCode && isRtl(sourceCode) ? "rtl" : "auto"}
              lang={getLanguage(sourceCode)?.code}
              className="max-h-80 overflow-auto whitespace-pre-wrap break-words leading-relaxed text-ink"
            >
              {originalText}
            </div>
          )}
        </Panel>

        <Panel
          title="Translated text"
          badge={<span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">{targetName}</span>}
          actions={
            <>
              <CopyButton text={translatedText} label="Copy Translation" />
              <button
                type="button"
                className={btn.small}
                onClick={() => downloadText(translatedText, `${filenameBase}-${target}.txt`)}
              >
                <FileDown className="size-4" aria-hidden="true" />
                Download TXT
              </button>
            </>
          }
          footer={
            <div className="flex flex-col gap-2 rounded-b-2xl border-t border-line bg-surface px-4 py-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <LanguageSelect
                  id="retranslate-target"
                  label="Translate to another language"
                  value={selectedTarget}
                  onChange={onTargetChange}
                  compact
                  disabled={busy}
                />
              </div>
              <button type="button" className={`${btn.secondary} text-sm`} onClick={onTranslateAgain} disabled={busy}>
                <RefreshCw className={`size-4 ${busy ? "animate-spin" : ""}`} aria-hidden="true" />
                Translate Again
              </button>
            </div>
          }
        >
          {stale && (
            <p className="mb-3 rounded-lg bg-brand-50 px-3 py-2 text-xs font-medium text-brand-700">
              Settings changed — click Translate Again to update.
            </p>
          )}
          <div
            dir={isRtl(target) ? "rtl" : "ltr"}
            lang={target}
            className="max-h-80 overflow-auto whitespace-pre-wrap break-words leading-relaxed text-ink"
          >
            {translatedText}
          </div>
        </Panel>
      </div>
    </div>
  );
});
