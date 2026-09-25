"use client";

import { ChevronDown } from "lucide-react";
import { AUTO_DETECT, getLanguage, LANGUAGES, POPULAR_CODES } from "@/lib/languages";

const popular = POPULAR_CODES.map((c) => getLanguage(c)!);
const others = LANGUAGES.filter((l) => !POPULAR_CODES.includes(l.code)).sort((a, b) =>
  a.name.localeCompare(b.name),
);

interface Props {
  id: string;
  label: string;
  value: string;
  onChange: (code: string) => void;
  includeAuto?: boolean;
  disabled?: boolean;
  compact?: boolean;
  hideLabel?: boolean;
}

export function LanguageSelect({ id, label, value, onChange, includeAuto, disabled, compact, hideLabel }: Props) {
  return (
    <div>
      <label
        htmlFor={id}
        className={hideLabel ? "sr-only" : "mb-1.5 block text-sm font-semibold text-ink"}
      >
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full appearance-none rounded-xl border border-line bg-white pr-10 font-medium text-ink shadow-sm transition hover:border-brand-100 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100 disabled:opacity-60 ${
            compact ? "py-2 pl-3 text-sm" : "py-3 pl-4"
          }`}
        >
          {includeAuto && <option value={AUTO_DETECT}>Auto Detect</option>}
          <optgroup label="Popular">
            {popular.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="All languages">
            {others.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </optgroup>
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
