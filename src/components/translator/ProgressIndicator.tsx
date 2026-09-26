import { Check, Languages, ScanText } from "lucide-react";

interface Props {
  stage: "reading" | "translating";
  label: string;
  value: number;
}

export function ProgressIndicator({ stage, label, value }: Props) {
  const steps = [
    { key: "reading", title: "Reading text…", icon: ScanText },
    { key: "translating", title: "Translating…", icon: Languages },
  ] as const;
  const activeIndex = stage === "reading" ? 0 : 1;
  const determinate = stage === "reading";

  return (
    <div role="status" aria-live="polite" className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
      <ol className="flex items-center gap-3">
        {steps.map((step, i) => {
          const done = i < activeIndex;
          const active = i === activeIndex;
          const Icon = done ? Check : step.icon;
          return (
            <li key={step.key} className="flex flex-1 items-center gap-2">
              <span
                className={`grid size-8 shrink-0 place-items-center rounded-full transition ${
                  done ? "bg-emerald-500 text-white" : active ? "bg-brand-gradient text-white" : "bg-white text-ink-muted"
                }`}
              >
                <Icon className={`size-4 ${active ? "animate-pulse" : ""}`} aria-hidden="true" />
              </span>
              <span className={`text-sm font-semibold ${active ? "text-ink" : "text-ink-muted"}`}>{step.title}</span>
            </li>
          );
        })}
      </ol>
      <div
        className="mt-4 h-2 overflow-hidden rounded-full bg-white"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={determinate ? Math.round(value * 100) : undefined}
      >
        {determinate ? (
          <div
            className="h-full rounded-full bg-brand-gradient transition-[width] duration-300"
            style={{ width: `${Math.max(4, value * 100)}%` }}
          />
        ) : (
          <div className="h-full w-2/5 animate-progress rounded-full bg-brand-gradient" />
        )}
      </div>
      <p className="mt-2 text-xs text-ink-soft">{label}</p>
    </div>
  );
}
